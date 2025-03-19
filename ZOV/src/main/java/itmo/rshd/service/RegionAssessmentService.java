package itmo.rshd.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import itmo.rshd.model.Region;
import itmo.rshd.model.User;
import itmo.rshd.repository.RegionRepository;
import itmo.rshd.repository.UserRepository;

@Service
public class RegionAssessmentService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RegionRepository regionRepository;

    public boolean shouldDeployOreshnik(String regionId) {
        // Get the region by ID
        Region region = regionRepository.findById(regionId).orElse(null);
        if (region == null) {
            return false;
        }
        
        // Check if region has low average rating and no important persons
        return region.getAverageSocialRating() < 30 && region.getImportantPersonsCount() == 0;
    }
    
    public boolean shouldDeployOreshnikByCalculation(String regionId) {
        // Get users in the region
        List<User> usersInRegion = userRepository.findByRegionId(regionId);
        if (usersInRegion.isEmpty()) {
            return false;
        }
        
        // Calculate average social rating manually
        double totalRating = 0;
        for (User user : usersInRegion) {
            totalRating += user.getSocialRating();
        }
        double averageRating = totalRating / usersInRegion.size();
        
        // Check for important persons in the region
        List<User> importantPersons = userRepository.findImportantPersonsInRegion(regionId);
        
        return averageRating < 30 && importantPersons.isEmpty();
    }

    public boolean deployOreshnik(String regionId) {
        if (shouldDeployOreshnik(regionId)) {
            // Implementation of missile deployment logic
            // This is where you'd integrate with your missile control system
            System.out.println("ORESHNIK deployed to region: " + regionId);
            
            // Mark region as under threat or destroyed
            try {
                Region region = regionRepository.findById(regionId).orElse(null);
                if (region != null) {
                    region.setUnderThreat(true);
                    regionRepository.save(region);
                }
                return true;
            } catch (Exception ex) {
                System.err.println("Error updating region after missile deployment: " + ex.getMessage());
                return false;
            }
        }
        return false;
    }
}
