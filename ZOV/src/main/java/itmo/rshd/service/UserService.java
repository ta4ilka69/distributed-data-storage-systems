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
        
        try {
            // Try to use Spring Data's built-in geospatial query first
            if (location.getPosition() != null) {
                return userRepository.findByCurrentLocationPositionNear(
                    new org.springframework.data.geo.Point(
                        location.getPosition().getX(), 
                        location.getPosition().getY()
                    ),
                    new org.springframework.data.geo.Distance(maxDistanceKm, org.springframework.data.geo.Metrics.KILOMETERS)
                );
            }
        } catch (Exception e) {
            // Fall back to manual query if there's an issue
            System.out.println("Warning: Using fallback query for near users search - " + e.getMessage());
        }
        
        // Fallback to the custom query
        return userRepository.findUsersNearLocation(location.getLongitude(), location.getLatitude(), maxDistanceMeters);
    }

    public List<User> findUsersBelowRating(double threshold) {
        return userRepository.findUsersBelowRating(threshold);
    }

    /**
     * Update user's social rating based on their rating of another user
     * @param raterId ID of the user giving the rating
     * @param targetId ID of the user being rated
     * @param ratingChange The rating change (positive for like, negative for dislike)
     * @return The updated rater user
     */
    public User updateRaterSocialRating(String raterId, String targetId, double ratingChange) {
        Optional<User> raterOpt = userRepository.findById(raterId);
        Optional<User> targetOpt = userRepository.findById(targetId);
        
        if (raterOpt.isPresent() && targetOpt.isPresent()) {
            User rater = raterOpt.get();
            User target = targetOpt.get();
            double raterImpact = 0;
            
            // Calculate impact based on the target's status
            switch (target.getStatus()) {
                case VIP:
                    // Rating a VIP has higher consequences
                    raterImpact = ratingChange > 0 ? 5.0 : -10.0; // Rewarded for liking, punished more for disliking
                    break;
                case IMPORTANT:
                    raterImpact = ratingChange > 0 ? 3.0 : -7.0;
                    break;
                case REGULAR:
                    raterImpact = ratingChange > 0 ? 1.0 : -3.0;
                    break;
                case LOW:
                    // Rating someone with low status has lower impact, but still incentivizes kindness
                    raterImpact = ratingChange > 0 ? 0.5 : -1.0;
                    break;
            }
            
            // Update rater's social rating
            double newRating = Math.max(0, Math.min(100, rater.getSocialRating() + raterImpact));
            rater.setSocialRating(newRating);
            
            // Update status based on new rating
            updateUserStatusBasedOnRating(rater);
            
            return userRepository.save(rater);
        }
        
        return null;
    }

    // Helper method to update status based on rating
    private void updateUserStatusBasedOnRating(User user) {
        double rating = user.getSocialRating();
        if (rating >= 90) {
            user.setStatus(SocialStatus.VIP);
        } else if (rating >= 70) {
            user.setStatus(SocialStatus.IMPORTANT);
        } else if (rating >= 40) {
            user.setStatus(SocialStatus.REGULAR);
        } else {
            user.setStatus(SocialStatus.LOW);
        }
    }
} 