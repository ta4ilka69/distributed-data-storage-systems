package itmo.rshd.service;

import itmo.rshd.model.GeoLocation;
import itmo.rshd.model.User;
import itmo.rshd.model.User.SocialStatus;
import itmo.rshd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    public User updateUserLocation(String userId, GeoLocation location, String regionId, String districtId, String countryId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setCurrentLocation(location);
            user.setRegionId(regionId);
            user.setDistrictId(districtId);
            user.setCountryId(countryId);
            user.setLastLocationUpdateTimestamp(System.currentTimeMillis());
            return userRepository.save(user);
        }
        return null;
    }

    public User updateSocialRating(String userId, double newRating) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setSocialRating(newRating);
            
            // Update user status based on rating
            if (newRating >= 900) {
                user.setStatus(SocialStatus.VIP);
            } else if (newRating >= 700) {
                user.setStatus(SocialStatus.IMPORTANT);
            } else if (newRating >= 400) {
                user.setStatus(SocialStatus.REGULAR);
            } else {
                user.setStatus(SocialStatus.LOW);
            }
            
            return userRepository.save(user);
        }
        return null;
    }

    public List<User> findUsersInRegion(String regionId) {
        return userRepository.findByRegionId(regionId);
    }

    public List<User> findImportantPersonsInRegion(String regionId) {
        return userRepository.findImportantPersonsInRegion(regionId);
    }

    public List<User> findUsersNearLocation(GeoLocation location, double maxDistanceKm) {
        // Convert km to meters for MongoDB query
        double maxDistanceMeters = maxDistanceKm * 1000;
        return userRepository.findUsersNearLocation(location.getLongitude(), location.getLatitude(), maxDistanceMeters);
    }

    public List<User> findUsersBelowRating(double threshold) {
        return userRepository.findUsersBelowRating(threshold);
    }
} 