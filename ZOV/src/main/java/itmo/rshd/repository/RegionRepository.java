package itmo.rshd.repository;

import itmo.rshd.model.Region;
import itmo.rshd.model.Region.RegionType;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionRepository extends MongoRepository<Region, String> {
    
    List<Region> findByType(RegionType type);
    
    List<Region> findByParentRegionId(String parentRegionId);
    
    @Query("{'averageSocialRating': {$lt: ?0}, 'importantPersonsCount': 0}")
    List<Region> findLowRatedRegionsWithoutImportantPersons(double threshold);
    
    @Query("{'averageSocialRating': {$lt: ?0}}")
    List<Region> findRegionsBelowRating(double threshold);
    
    @Query("{'boundaries': {$geoIntersects: {$geometry: {type: 'Point', coordinates: [?0, ?1]}}}}")
    List<Region> findRegionsContainingPoint(double longitude, double latitude);
    
    @Query("{'type': ?0, 'underThreat': true}")
    List<Region> findRegionsUnderThreat(RegionType type);
    
    /**
     * Checks if a point is within the boundaries of a specific region
     * @param regionId The region ID to check
     * @param point The GeoJSON point to check
     * @return true if the point is within the region's boundaries, false otherwise
     */
    @Query(value = "{'_id': ?0, 'boundaries': {$geoIntersects: {$geometry: ?1}}}", exists = true)
    boolean isPointInRegion(String regionId, GeoJsonPoint point);
} 