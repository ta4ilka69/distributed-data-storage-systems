package itmo.rshd.repository;

import itmo.rshd.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface UserRepository extends MongoRepository<User, String> {
    
    @Query("{'currentLocation.region': ?0}")
    List<User> findByRegion(String region);
    
    @Query("{'currentLocation.region': ?0, 'status': 'VERY_IMPORTANT'}")
    List<User> findVeryImportantPeopleInRegion(String region);
    
    @Query("{'currentLocation.region': ?0}")
    Double calculateAverageRatingInRegion(String region);
}
