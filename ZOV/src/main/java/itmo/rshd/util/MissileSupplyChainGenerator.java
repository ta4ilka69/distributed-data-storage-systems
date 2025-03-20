package itmo.rshd.util;

import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversalSource;
import org.apache.tinkerpop.gremlin.structure.Vertex;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import itmo.rshd.repository.RegionRepository;
import itmo.rshd.model.Region;
import itmo.rshd.model.GeoLocation;

import java.util.*;

@Component
public class MissileSupplyChainGenerator implements CommandLineRunner {

    private final GraphTraversalSource g;
    private final RegionRepository regionRepository;
    private final Random random = new Random();

    @Autowired
    public MissileSupplyChainGenerator(GraphTraversalSource g, RegionRepository regionRepository) {
        this.g = g;
        this.regionRepository = regionRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Check if supply chain already exists
        if (g.V().hasLabel("SupplyDepot").count().next() > 0) {
            System.out.println("Supply chain already exists. Skipping generation.");
            return;
        }

        System.out.println("Generating missile supply chain...");
        
        // Create main hubs in federal regions
        List<Region> federalRegions = regionRepository.findByType(Region.RegionType.REGION);
        Map<String, Vertex> regionalHubs = createRegionalHubs(federalRegions);
        
        // Create local depots in cities
        List<Region> cities = regionRepository.findByType(Region.RegionType.CITY);
        Map<String, Vertex> cityDepots = createCityDepots(cities, regionalHubs);
        
        // Create distribution points in districts
        List<Region> districts = regionRepository.findByType(Region.RegionType.DISTRICT);
        createDistributionPoints(districts, cityDepots);

        System.out.println("Supply chain generation completed!");
    }

    private Map<String, Vertex> createRegionalHubs(List<Region> federalRegions) {
        Map<String, Vertex> hubs = new HashMap<>();
        
        for (Region region : federalRegions) {
            GeoLocation center = calculateCenterPoint(region.getBoundaries());
            
            Vertex hub = g.addV("SupplyDepot")
                .property("depotId", "hub-" + region.getId())
                .property("name", region.getName() + " Regional Hub")
                .property("type", "REGIONAL_HUB")
                .property("latitude", center.getLatitude())
                .property("longitude", center.getLongitude())
                .property("capacity", 10000 + random.nextInt(5000))
                .property("currentStock", 8000 + random.nextInt(2000))
                .property("securityLevel", "HIGH")
                .next();
            
            hubs.put(region.getId(), hub);
        }
        
        // Connect hubs with supply routes
        for (Vertex hub1 : hubs.values()) {
            for (Vertex hub2 : hubs.values()) {
                if (hub1 != hub2) {
                    g.addE("supplyRoute")
                        .from(hub1)
                        .to(hub2)
                        .property("capacity", 1000 + random.nextInt(500))
                        .property("securityLevel", "HIGH")
                        .property("transportType", "ARMORED_CONVOY")
                        .next();
                }
            }
        }
        
        return hubs;
    }

    private Map<String, Vertex> createCityDepots(List<Region> cities, Map<String, Vertex> regionalHubs) {
        Map<String, Vertex> cityDepots = new HashMap<>();
        
        for (Region city : cities) {
            GeoLocation center = calculateCenterPoint(city.getBoundaries());
            
            Vertex depot = g.addV("SupplyDepot")
                .property("depotId", "depot-" + city.getId())
                .property("name", city.getName() + " City Depot")
                .property("type", "CITY_DEPOT")
                .property("latitude", center.getLatitude())
                .property("longitude", center.getLongitude())
                .property("capacity", 2000 + random.nextInt(1000))
                .property("currentStock", 1000 + random.nextInt(1000))
                .property("securityLevel", "MEDIUM")
                .next();
            
            cityDepots.put(city.getId(), depot);
            
            // Connect to regional hub
            Vertex parentHub = regionalHubs.get(city.getParentRegionId());
            if (parentHub != null) {
                g.addE("supplyRoute")
                    .from(parentHub)
                    .to(depot)
                    .property("capacity", 500 + random.nextInt(200))
                    .property("securityLevel", "MEDIUM")
                    .property("transportType", "SECURE_TRUCK")
                    .next();
            }
        }
        
        return cityDepots;
    }

    private void createDistributionPoints(List<Region> districts, Map<String, Vertex> cityDepots) {
        for (Region district : districts) {
            if (random.nextDouble() < 0.7) { // 70% chance of having a distribution point
                GeoLocation center = calculateCenterPoint(district.getBoundaries());
                
                Vertex point = g.addV("SupplyDepot")
                    .property("depotId", "dist-" + district.getId())
                    .property("name", district.getName() + " Distribution Point")
                    .property("type", "DISTRIBUTION_POINT")
                    .property("latitude", center.getLatitude())
                    .property("longitude", center.getLongitude())
                    .property("capacity", 500 + random.nextInt(200))
                    .property("currentStock", 200 + random.nextInt(300))
                    .property("securityLevel", "STANDARD")
                    .next();
                
                // Connect to city depot
                Vertex cityDepot = cityDepots.get(district.getParentRegionId());
                if (cityDepot != null) {
                    g.addE("supplyRoute")
                        .from(cityDepot)
                        .to(point)
                        .property("capacity", 100 + random.nextInt(50))
                        .property("securityLevel", "STANDARD")
                        .property("transportType", "LIGHT_VEHICLE")
                        .next();
                }
            }
        }
    }

    private GeoLocation calculateCenterPoint(List<GeoLocation> boundaries) {
        double latSum = 0, lonSum = 0;
        for (GeoLocation point : boundaries) {
            latSum += point.getLatitude();
            lonSum += point.getLongitude();
        }
        return new GeoLocation(
            latSum / boundaries.size(),
            lonSum / boundaries.size()
        );
    }
} 