package itmo.rshd.util;

import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversalSource;
import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.__;
import org.apache.tinkerpop.gremlin.structure.Vertex;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.data.mongodb.core.geo.GeoJsonPolygon;
import org.springframework.data.geo.Point;
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
        if (g == null) {
            System.out.println("Graph traversal source is null. Supply chain generation will be skipped.");
            return;
        }
        
        try {
            // Check if supply chain already exists
            Long count = g.V().hasLabel("SupplyDepot").count().tryNext().orElse(0L);
            if (count > 0) {
                System.out.println("Supply chain already exists. Skipping generation.");
                return;
            }

            System.out.println("Generating missile supply chain...");
            
            // Create main hubs in federal regions
            List<Region> federalRegions = regionRepository.findByType(Region.RegionType.REGION);
            if (federalRegions.isEmpty()) {
                System.out.println("No federal regions found. Skipping supply chain generation.");
                return;
            }
            
            Map<String, Vertex> regionalHubs = createRegionalHubs(federalRegions);
            
            // Create local depots in cities
            List<Region> cities = regionRepository.findByType(Region.RegionType.CITY);
            Map<String, Vertex> cityDepots = createCityDepots(cities, regionalHubs);
            
            // Create distribution points in districts
            List<Region> districts = regionRepository.findByType(Region.RegionType.DISTRICT);
            createDistributionPoints(districts, cityDepots);

            System.out.println("Supply chain generation completed!");
        } catch (Exception e) {
            System.err.println("Error generating missile supply chain: " + e.getMessage());
            e.printStackTrace();
            System.out.println("Application will continue without supply chain data.");
        }
    }

    private Map<String, Vertex> createRegionalHubs(List<Region> federalRegions) {
        Map<String, Vertex> hubs = new HashMap<>();
        
        for (Region region : federalRegions) {
            try {
                GeoLocation center = calculateCenterPoint(region.getBoundaries());
                
                Vertex hub = g.addV("SupplyDepot")
                    .property("depotId", "hub-" + region.getId())
                    .property("name", region.getName() + " Regional Hub")
                    .property("type", "REGIONAL_HUB")
                    .property("latitude", String.valueOf(center.getLatitude()))
                    .property("longitude", String.valueOf(center.getLongitude()))
                    .property("capacity", String.valueOf(10000 + random.nextInt(5000)))
                    .property("currentStock", String.valueOf(8000 + random.nextInt(2000)))
                    .property("securityLevel", "HIGH")
                    .next();
                
                hubs.put(region.getId(), hub);
                System.out.println("Created hub for region: " + region.getName());
            } catch (Exception e) {
                System.err.println("Error creating hub for region " + region.getName() + ": " + e.getMessage());
            }
        }
        
        // Connect hubs with supply routes
        for (Vertex hub1 : hubs.values()) {
            for (Vertex hub2 : hubs.values()) {
                try {
                    if (hub1 != hub2) {
                        g.addE("SupplyRoute")
                            .from(hub1)
                            .to(hub2)
                            .property("capacity", String.valueOf(1000 + random.nextInt(500)))
                            .property("securityLevel", "HIGH")
                            .property("transportType", "ARMORED_CONVOY")
                            .property("isActive", true)
                            .next();
                    }
                } catch (Exception e) {
                    System.err.println("Error connecting hubs: " + e.getMessage());
                }
            }
        }
        
        return hubs;
    }

    private Map<String, Vertex> createCityDepots(List<Region> cities, Map<String, Vertex> regionalHubs) {
        Map<String, Vertex> cityDepots = new HashMap<>();
        
        for (Region city : cities) {
            try {
                GeoLocation center = calculateCenterPoint(city.getBoundaries());
                
                Vertex depot = g.addV("SupplyDepot")
                    .property("depotId", "depot-" + city.getId())
                    .property("name", city.getName() + " City Depot")
                    .property("type", "CITY_DEPOT")
                    .property("latitude", String.valueOf(center.getLatitude()))
                    .property("longitude", String.valueOf(center.getLongitude()))
                    .property("capacity", String.valueOf(2000 + random.nextInt(1000)))
                    .property("currentStock", String.valueOf(1000 + random.nextInt(1000)))
                    .property("securityLevel", "MEDIUM")
                    .next();
                
                cityDepots.put(city.getId(), depot);
                
                // Connect to regional hub
                Vertex parentHub = regionalHubs.get(city.getParentRegionId());
                if (parentHub != null) {
                    g.addE("SupplyRoute")
                        .from(parentHub)
                        .to(depot)
                        .property("capacity", String.valueOf(500 + random.nextInt(200)))
                        .property("securityLevel", "MEDIUM")
                        .property("transportType", "SECURE_TRUCK")
                        .property("isActive", true)
                        .next();
                }
            } catch (Exception e) {
                System.err.println("Error creating depot for city " + city.getName() + ": " + e.getMessage());
            }
        }
        
        return cityDepots;
    }

    private void createDistributionPoints(List<Region> districts, Map<String, Vertex> cityDepots) {
        int count = 0;
        for (Region district : districts) {
            try {
                if (random.nextDouble() < 0.7) { // 70% chance of having a distribution point
                    GeoLocation center = calculateCenterPoint(district.getBoundaries());
                    
                    Vertex point = g.addV("SupplyDepot")
                        .property("depotId", "dist-" + district.getId())
                        .property("name", district.getName() + " Distribution Point")
                        .property("type", "DISTRIBUTION_POINT")
                        .property("latitude", String.valueOf(center.getLatitude()))
                        .property("longitude", String.valueOf(center.getLongitude()))
                        .property("capacity", String.valueOf(500 + random.nextInt(200)))
                        .property("currentStock", String.valueOf(200 + random.nextInt(300)))
                        .property("securityLevel", "STANDARD")
                        .next();
                    
                    // Connect to city depot
                    Vertex cityDepot = cityDepots.get(district.getParentRegionId());
                    if (cityDepot != null) {
                        g.addE("SupplyRoute")
                            .from(cityDepot)
                            .to(point)
                            .property("capacity", String.valueOf(100 + random.nextInt(50)))
                            .property("securityLevel", "STANDARD")
                            .property("transportType", "LIGHT_VEHICLE")
                            .property("isActive", true)
                            .next();
                    }
                    
                    count++;
                    if (count % 10 == 0) {
                        System.out.println("Created " + count + " distribution points so far...");
                    }
                }
            } catch (Exception e) {
                System.err.println("Error creating distribution point for district " + district.getName() + ": " + e.getMessage());
            }
        }
        
        System.out.println("Created a total of " + count + " distribution points.");
    }

    private GeoLocation calculateCenterPoint(GeoJsonPolygon boundaries) {
        if (boundaries == null) {
            // Default to center of Russia if boundaries not defined
            return new GeoLocation(55.7558, 37.6173); // Moscow coordinates as default
        }
        
        List<Point> points = boundaries.getPoints();
        
        if (points == null || points.size() < 4) {
            // Default to center of Russia if boundaries not properly defined
            return new GeoLocation(55.7558, 37.6173); // Moscow coordinates as default
        }
        
        double latSum = 0, lonSum = 0;
        for (Point point : points) {
            try {
                latSum += point.getY(); // Latitude
                lonSum += point.getX(); // Longitude
            } catch (Exception e) {
                // Skip invalid points
            }
        }
        
        if (points.size() == 0) {
            return new GeoLocation(55.7558, 37.6173); // Moscow coordinates as default
        }
        
        return new GeoLocation(
            latSum / points.size(),
            lonSum / points.size()
        );
    }
} 