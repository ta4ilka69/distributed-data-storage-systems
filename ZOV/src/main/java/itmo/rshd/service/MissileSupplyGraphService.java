package itmo.rshd.service;

import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversalSource;
import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.__;
import org.apache.tinkerpop.gremlin.structure.Edge;
import org.apache.tinkerpop.gremlin.structure.Vertex;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MissileSupplyGraphService {

    private final GraphTraversalSource g;
    
    private GeospatialService geospatialService;

    @Autowired
    public MissileSupplyGraphService(GraphTraversalSource g) {
        this.g = g;
    }
    
    @Autowired
    public void setGeospatialService(GeospatialService geospatialService) {
        this.geospatialService = geospatialService;
    }

    @PostConstruct
    public void initialize() {
        if (g == null) {
            System.out.println("Graph traversal source is null. Supply chain functionality will be disabled.");
            return;
        }
        
        try {
            // Create schema if needed
            Long count = g.V().hasLabel("SupplyDepot").count().tryNext().orElse(0L);
            if (count == 0) {
                createInitialSchema();
            }
        } catch (Exception e) {
            System.err.println("Error initializing MissileSupplyGraphService: " + e.getMessage());
        }
    }

    private void createInitialSchema() {
        // Create property keys and indices
        // No transaction needed for remote graph
    }

    public Vertex addSupplyDepot(String depotId, String name, double latitude, double longitude, int capacity) {
        if (g == null) {
            System.out.println("Graph traversal source is null. Cannot add supply depot: " + name);
            return null;
        }
        
        try {
            Vertex depot = g.addV("SupplyDepot")
                    .property("depotId", depotId)
                    .property("name", name)
                    .property("latitude", String.valueOf(latitude))
                    .property("longitude", String.valueOf(longitude))
                    .property("capacity", String.valueOf(capacity))
                    .property("currentStock", "0")
                    .next();
            return depot;
        } catch (Exception e) {
            System.err.println("Error adding supply depot: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public Vertex addMissileType(String missileTypeId, String name, double range, double effectRadius) {
        try {
            Vertex missileType = g.addV("MissileType")
                    .property("missileTypeId", missileTypeId)
                    .property("name", name)
                    .property("range", range)
                    .property("effectRadius", effectRadius)
                    .next();
            return missileType;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    public Edge addSupplyRoute(String sourceDepotId, String targetDepotId, double distance, double riskFactor) {
        try {
            Vertex sourceDepot = findDepotById(sourceDepotId);
            Vertex targetDepot = findDepotById(targetDepotId);
            
            if (sourceDepot == null || targetDepot == null) {
                throw new IllegalArgumentException("Source or target depot not found");
            }
            
            Edge route = g.addE("SupplyRoute")
                    .from(sourceDepot)
                    .to(targetDepot)
                    .property("distance", distance)
                    .property("riskFactor", riskFactor)
                    .property("isActive", true)
                    .next();
            return route;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }
    
    private Vertex findDepotById(String depotId) {
        if (g == null) {
            System.out.println("Graph traversal source is null. Cannot find depot: " + depotId);
            return null;
        }
        
        try {
            return g.V().hasLabel("SupplyDepot").has("depotId", depotId).tryNext().orElse(null);
        } catch (Exception e) {
            System.err.println("Error finding depot by ID: " + e.getMessage());
            return null;
        }
    }

    public void addMissilesToDepot(String depotId, String missileTypeId, int quantity) {
        try {
            Vertex depot = findDepotById(depotId);
            Vertex missileType = g.V().has("MissileType", "missileTypeId", missileTypeId).tryNext().orElse(null);
            
            if (depot == null || missileType == null) {
                throw new IllegalArgumentException("Depot or missile type not found");
            }
            
            // Check if there's already a supply relationship
            boolean hasSuppliesEdge = g.V(depot).outE("Supplies").inV().is(missileType).hasNext();
            
            if (hasSuppliesEdge) {
                // Update existing relationship
                Object edgeObj = g.V(depot).outE("Supplies").as("e")
                                .inV().is(missileType)
                                .select("e")
                                .next();
                                
                if (edgeObj instanceof Edge) {
                    Edge supply = (Edge) edgeObj;
                    int currentQuantity = 0;
                    try {
                        currentQuantity = Integer.parseInt(supply.value("quantity").toString());
                    } catch (Exception e) {
                        // Ignore parse errors
                    }
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
            int currentStock = 0;
            try {
                Object stockObj = g.V(depot).values("currentStock").next();
                if (stockObj != null) {
                    currentStock = Integer.parseInt(stockObj.toString());
                }
            } catch (Exception e) {
                // Ignore errors
            }
            
            g.V(depot).property("currentStock", currentStock + quantity).iterate();
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Gets all active supply routes in the system
     */
    public List<Map<String, Object>> getAllSupplyRoutes() {
        List<Map<String, Object>> result = new ArrayList<>();
        
        if (g == null) {
            System.out.println("Graph traversal source is null. Returning empty supply routes list.");
            return result;
        }
        
        try {
            // Use a safer approach with tryNext() to avoid deserialization issues
            g.E().hasLabel("SupplyRoute").has("isActive", true).toList().forEach(edge -> {
                try {
                    Vertex sourceVertex = edge.outVertex();
                    Vertex targetVertex = edge.inVertex();
                    
                    String sourceDepotId = safeGetProperty(sourceVertex, "depotId");
                    String targetDepotId = safeGetProperty(targetVertex, "depotId");
                    
                    if (sourceDepotId != null && targetDepotId != null) {
                        Map<String, Object> routeInfo = new HashMap<>();
                        routeInfo.put("sourceDepotId", sourceDepotId);
                        routeInfo.put("targetDepotId", targetDepotId);
                        routeInfo.put("distance", safeGetProperty(edge, "distance", 0.0));
                        routeInfo.put("riskFactor", safeGetProperty(edge, "riskFactor", 0.0));
                        
                        result.add(routeInfo);
                    }
                } catch (Exception ex) {
                    // Skip this edge if there's an error
                    System.err.println("Error processing edge: " + ex.getMessage());
                }
            });
        } catch (Exception e) {
            System.err.println("Error getting supply routes: " + e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }
    
    /**
     * Safely gets a string property from a vertex
     */
    private String safeGetProperty(Vertex vertex, String propertyName) {
        try {
            Object value = vertex.property(propertyName).orElse(null);
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Safely gets a numeric property from an edge
     */
    private <T> T safeGetProperty(Edge edge, String propertyName, T defaultValue) {
        try {
            Object value = edge.property(propertyName).orElse(null);
            if (value == null) {
                return defaultValue;
            }
            
            if (defaultValue instanceof Double) {
                return (T) Double.valueOf(value.toString());
            } else if (defaultValue instanceof Integer) {
                return (T) Integer.valueOf(value.toString());
            } else if (defaultValue instanceof Boolean) {
                return (T) Boolean.valueOf(value.toString());
            }
            
            return (T) value;
        } catch (Exception e) {
            return defaultValue;
        }
    }
    
    /**
     * Finds all supply depots in the system
     */
    public List<Map<String, Object>> findAllDepots() {
        List<Map<String, Object>> result = new ArrayList<>();
        
        if (g == null) {
            System.out.println("Graph traversal source is null. Returning empty depot list.");
            return result;
        }
        
        try {
            // For safety, limit to max 50 depots
            g.V().hasLabel("SupplyDepot").limit(50).forEachRemaining(vertex -> {
                try {
                    Map<String, Object> depotInfo = new HashMap<>();
                    depotInfo.put("depotId", safeGetProperty(vertex, "depotId"));
                    depotInfo.put("name", safeGetProperty(vertex, "name"));
                    
                    // Add coordinates with appropriate error handling
                    try {
                        String latStr = safeGetProperty(vertex, "latitude");
                        depotInfo.put("latitude", latStr != null ? Double.parseDouble(latStr) : 0.0);
                    } catch (Exception e) {
                        depotInfo.put("latitude", 0.0);
                        System.err.println("Error parsing latitude for depot: " + e.getMessage());
                    }
                    
                    try {
                        String lonStr = safeGetProperty(vertex, "longitude");
                        depotInfo.put("longitude", lonStr != null ? Double.parseDouble(lonStr) : 0.0);
                    } catch (Exception e) {
                        depotInfo.put("longitude", 0.0);
                        System.err.println("Error parsing longitude for depot: " + e.getMessage());
                    }
                    
                    // Add capacity and current stock with appropriate error handling
                    try {
                        String capacityStr = safeGetProperty(vertex, "capacity");
                        depotInfo.put("capacity", capacityStr != null ? Integer.parseInt(capacityStr) : 0);
                    } catch (Exception e) {
                        depotInfo.put("capacity", 0);
                        System.err.println("Error parsing capacity for depot: " + e.getMessage());
                    }
                    
                    try {
                        String stockStr = safeGetProperty(vertex, "currentStock");
                        depotInfo.put("currentStock", stockStr != null ? Integer.parseInt(stockStr) : 0);
                    } catch (Exception e) {
                        depotInfo.put("currentStock", 0);
                        System.err.println("Error parsing currentStock for depot: " + e.getMessage());
                    }
                    
                    result.add(depotInfo);
                } catch (Exception ex) {
                    // Skip this depot if there's an error
                    System.err.println("Error processing depot vertex: " + ex.getMessage());
                }
            });
        } catch (Exception e) {
            System.err.println("Error finding all depots: " + e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }
    
    /**
     * Finds all supply depots located in a specific region
     */
    public List<Map<String, Object>> findDepotsInRegion(String regionId) {
        if (g == null) {
            System.out.println("Graph traversal source is null. Returning empty depot list for region: " + regionId);
            return new ArrayList<>();
        }
        
        // Get all depots
        List<Map<String, Object>> allDepots = findAllDepots();
        
        // Filter depots that are in the given region
        return allDepots.stream()
                .filter(depot -> {
                    try {
                        double latitude = (double) depot.getOrDefault("latitude", 0.0);
                        double longitude = (double) depot.getOrDefault("longitude", 0.0);
                        return geospatialService.isPointInRegion(regionId, latitude, longitude);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * Finds the optimal supply route between two depots
     */
    public List<Map<String, Object>> findOptimalSupplyRoute(String fromDepotId, String toDepotId) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        if (g == null) {
            System.out.println("Graph traversal source is null. Cannot find optimal route between depots.");
            return result;
        }
        
        try {
            // Find shortest path with lowest risk between depots
            g.V().has("SupplyDepot", "depotId", fromDepotId)
                .repeat(
                    __.outE("SupplyRoute").has("isActive", true)
                    .order().by("riskFactor", org.apache.tinkerpop.gremlin.process.traversal.Order.asc)
                    .inV().simplePath()
                )
                .until(__.has("SupplyDepot", "depotId", toDepotId))
                .path()
                .limit(1)
                .tryNext()
                .ifPresent(path -> {
                    List<Object> objects = path.objects();
                    
                    for (Object object : objects) {
                        try {
                            Map<String, Object> pathItem = new HashMap<>();
                            
                            if (object instanceof Vertex) {
                                Vertex v = (Vertex) object;
                                pathItem.put("type", "depot");
                                pathItem.put("id", safeGetProperty(v, "depotId"));
                                pathItem.put("name", safeGetProperty(v, "name"));
                            } else if (object instanceof Edge) {
                                Edge e = (Edge) object;
                                pathItem.put("type", "route");
                                pathItem.put("distance", safeGetProperty(e, "distance", 0.0));
                                pathItem.put("riskFactor", safeGetProperty(e, "riskFactor", 0.0));
                            }
                            
                            result.add(pathItem);
                        } catch (Exception ex) {
                            // Skip this path item if there's an error
                            System.err.println("Error processing path item: " + ex.getMessage());
                        }
                    }
                });
        } catch (Exception e) {
            System.err.println("Error finding optimal route: " + e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }
    
    /**
     * Finds depots with a specific missile type and minimum quantity
     */
    public List<Map<String, Object>> findDepotsWithMissileType(String missileTypeId, int minQuantity) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        try {
            // Get all depots
            List<Vertex> potentialDepots = new ArrayList<>();
            
            g.V().has("MissileType", "missileTypeId", missileTypeId)
                .inE("Supplies")
                .has("quantity", org.apache.tinkerpop.gremlin.process.traversal.P.gte(minQuantity))
                .outV()
                .toList()
                .forEach(vertex -> potentialDepots.add(vertex));
            
            // For each depot, create a proper map with the depot info
            for (Vertex depot : potentialDepots) {
                try {
                    Map<String, Object> depotInfo = new HashMap<>();
                    depotInfo.put("depotId", safeGetProperty(depot, "depotId"));
                    depotInfo.put("name", safeGetProperty(depot, "name"));
                    
                    try {
                        depotInfo.put("latitude", Double.parseDouble(safeGetProperty(depot, "latitude")));
                    } catch (Exception e) {
                        depotInfo.put("latitude", 0.0);
                    }
                    
                    try {
                        depotInfo.put("longitude", Double.parseDouble(safeGetProperty(depot, "longitude")));
                    } catch (Exception e) {
                        depotInfo.put("longitude", 0.0);
                    }
                    
                    try {
                        depotInfo.put("currentStock", Integer.parseInt(safeGetProperty(depot, "currentStock")));
                    } catch (Exception e) {
                        depotInfo.put("currentStock", 0);
                    }
                    
                    result.add(depotInfo);
                } catch (Exception ex) {
                    // Skip this depot if there's an error
                    System.err.println("Error processing depot with missile type: " + ex.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error finding depots with missile type: " + e.getMessage());
            e.printStackTrace();
        }
        
        return result;
    }
} 