package itmo.rshd.service;

import itmo.rshd.model.Region;
import itmo.rshd.repository.RegionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.geo.GeoJsonPolygon;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for handling geospatial operations
 * Created to break circular dependencies between services
 */
@Service
public class GeospatialService {

    private final RegionRepository regionRepository;

    @Autowired
    public GeospatialService(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    /**
     * Checks if a geographic point (latitude, longitude) is within a region's boundaries
     * @param regionId The ID of the region
     * @param latitude The latitude of the point
     * @param longitude The longitude of the point
     * @return true if the point is within the region's boundaries, false otherwise
     */
    public boolean isPointInRegion(String regionId, double latitude, double longitude) {
        Optional<Region> regionOpt = regionRepository.findById(regionId);
        if (!regionOpt.isPresent() || regionOpt.get().getBoundaries() == null) {
            return false;
        }
        
        Region region = regionOpt.get();
        GeoJsonPolygon boundaries = region.getBoundaries();
        
        // Create point to check
        GeoJsonPoint point = new GeoJsonPoint(longitude, latitude);
        
        // Check if the point is within the polygon boundaries
        // This uses MongoDB's $geoWithin operator through Spring Data
        return regionRepository.isPointInRegion(regionId, point);
    }
} 