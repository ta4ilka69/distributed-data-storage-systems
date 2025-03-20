package itmo.rshd.repository;

import itmo.rshd.model.User;
import itmo.rshd.model.User.SocialStatus;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    User findByUsername(String username);
    
    List<User> findByRegionId(String regionId);
    
    List<User> findByDistrictId(String districtId);
    
    List<User> findByCountryId(String countryId);
    
    List<User> findByStatus(SocialStatus status);
    
    // Using Spring Data's built-in geospatial queries
    List<User> findByCurrentLocationPositionNear(Point location, Distance distance);
    
    // For compatibility with existing service methods
    @Query("{'currentLocation.position': {$near: {$geometry: {type: 'Point', coordinates: [?0, ?1]}, $maxDistance: ?2}}}")
    List<User> findUsersNearLocation(double longitude, double latitude, double maxDistanceMeters);
    
    @Query("{'regionId': ?0, 'status': {$in: ['IMPORTANT', 'VIP']}}")
    List<User> findImportantPersonsInRegion(String regionId);
    
    @Query("{'socialRating': {$lt: ?0}}")
    List<User> findUsersBelowRating(double rating);
}
