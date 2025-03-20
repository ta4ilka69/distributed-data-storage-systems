package itmo.rshd.service;

import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversalSource;
import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.__;
import org.apache.tinkerpop.gremlin.structure.Edge;
import org.apache.tinkerpop.gremlin.structure.Vertex;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MissileSupplyGraphService {

    private final GraphTraversalSource g;

    @Autowired
    public MissileSupplyGraphService(GraphTraversalSource g) {
        this.g = g;
    }

    @PostConstruct
    public void initialize() {
        // Create schema if needed
        if (g.V().hasLabel("SupplyDepot").count().next() == 0) {
            createInitialSchema();
        }
    }

    private void createInitialSchema() {
        // Create property keys and indices
        // No transaction needed for remote graph
    }

    public Vertex addSupplyDepot(String depotId, String name, double latitude, double longitude, int capacity) {
        Vertex depot = g.addV("SupplyDepot")
                .property("depotId", depotId)
                .property("name", name)
                .property("latitude", latitude)
                .property("longitude", longitude)
                .property("capacity", capacity)
                .property("currentStock", 0)
                .next();
        return depot;
    }

    public Vertex addMissileType(String missileTypeId, String name, double range, double effectRadius) {
        Vertex missileType = g.addV("MissileType")
                .property("missileTypeId", missileTypeId)
                .property("name", name)
                .property("range", range)
                .property("effectRadius", effectRadius)
                .next();
        return missileType;
    }

    public Edge addSupplyRoute(String sourceDepotId, String targetDepotId, double distance, double riskFactor) {
        Vertex sourceDepot = g.V().has("SupplyDepot", "depotId", sourceDepotId).next();
        Vertex targetDepot = g.V().has("SupplyDepot", "depotId", targetDepotId).next();
        
        Edge route = g.addE("SupplyRoute")
                .from(sourceDepot)
                .to(targetDepot)
                .property("distance", distance)
                .property("riskFactor", riskFactor)
                .property("isActive", true)
                .next();
        return route;
    }

    public void addMissilesToDepot(String depotId, String missileTypeId, int quantity) {
        Vertex depot = g.V().has("SupplyDepot", "depotId", depotId).next();
        Vertex missileType = g.V().has("MissileType", "missileTypeId", missileTypeId).next();
        
        // Check if there's already a supply relationship
        if (g.V(depot).outE("Supplies").inV().is(missileType).hasNext()) {
            // Update existing relationship
            Object edgeObj = g.V(depot).outE("Supplies").as("e")
                            .inV().is(missileType)
                            .select("e")
                            .next();
                            
            if (edgeObj instanceof Edge) {
                Edge supply = (Edge) edgeObj;
                Object quantityObj = supply.value("quantity");
                int currentQuantity = quantityObj instanceof Number ? ((Number) quantityObj).intValue() : 0;
                supply.property("quantity", currentQuantity + quantity);
            }
        } else {
            // Create new relationship
            g.addE("Supplies")
                .from(depot)
                .to(missileType)
                .property("quantity", quantity)
                .iterate();
        }
        
        // Update current stock
        Object stockObj = g.V(depot).values("currentStock").next();
        int currentStock = stockObj instanceof Number ? ((Number) stockObj).intValue() : 0;
        g.V(depot).property("currentStock", currentStock + quantity).iterate();
    }

    public List<Map<String, Object>> findOptimalSupplyRoute(String fromDepotId, String toDepotId) {
        try {
            // Find shortest path with lowest risk between depots
            List<Object> path = g.V().has("SupplyDepot", "depotId", fromDepotId)
                    .repeat(
                        __.outE("SupplyRoute").has("isActive", true)
                        .order().by("riskFactor", org.apache.tinkerpop.gremlin.process.traversal.Order.asc)
                        .inV().simplePath()
                    ).until(
                        __.has("SupplyDepot", "depotId", toDepotId)
                    ).path().limit(1)
                    .next()
                    .objects();
            
            return path.stream()
                    .map(object -> {
                        Map<String, Object> result = new HashMap<>();
                        if (object instanceof Vertex) {
                            Vertex v = (Vertex) object;
                            result.put("type", "depot");
                            result.put("id", v.value("depotId"));
                            result.put("name", v.value("name"));
                        } else if (object instanceof Edge) {
                            Edge e = (Edge) object;
                            result.put("type", "route");
                            result.put("distance", e.value("distance"));
                            result.put("riskFactor", e.value("riskFactor"));
                        }
                        return result;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    public List<Map<String, Object>> findDepotsWithMissileType(String missileTypeId, int minQuantity) {
        List<Map<Object, Object>> results = g.V()
                .has("MissileType", "missileTypeId", missileTypeId)
                .inE("Supplies")
                .has("quantity", org.apache.tinkerpop.gremlin.process.traversal.P.gte(minQuantity))
                .outV()
                .valueMap("depotId", "name", "latitude", "longitude", "currentStock")
                .toList();
        
        return results.stream()
                .map(m -> {
                    Map<String, Object> convertedMap = new HashMap<>();
                    m.forEach((k, v) -> convertedMap.put(k.toString(), v));
                    return convertedMap;
                })
                .collect(Collectors.toList());
    }
} 