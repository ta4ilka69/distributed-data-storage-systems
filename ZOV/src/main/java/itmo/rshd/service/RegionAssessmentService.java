package itmo.rshd.service;

import java.util.List;
import java.util.Optional;

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
    
    @Autowired
    private WebSocketService webSocketService;

    public boolean shouldDeployOreshnik(String regionId) {
        // Get the region by ID
        Region region = regionRepository.findById(regionId).orElse(null);
        if (region == null) {
            return false;
        }

        // Check if region has low average rating and no important persons
        return region.getAverageSocialRating() < 35
                && region.getImportantPersonsCount() / region.getPopulationCount() < 0.02;
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
                    
                    // "Eliminate" users in the region and update statistics
                    eliminateUsersInRegion(regionId);
                    
                    // Recursively update parent regions
                    updateParentRegionStatistics(region.getParentRegionId());
                    
                    // Notify clients about the region update
                    webSocketService.notifyRegionStatusUpdate(region);
                }
                return true;
            } catch (Exception ex) {
                System.err.println("Error updating region after missile deployment: " + ex.getMessage());
                return false;
            }
        }
        return false;
    }
    
    /**
     * "Eliminates" users in a region after a missile strike
     */
    private void eliminateUsersInRegion(String regionId) {
        List<User> usersInRegion = userRepository.findByRegionId(regionId);
        
        // In a real system, we might want to mark users as "eliminated" rather than deleting them
        // For this simulation, we'll set their social rating to 0 and mark them as "eliminated"
        for (User user : usersInRegion) {
            user.setSocialRating(0);
            user.setActive(false); // Assuming we have an "active" field to mark users as eliminated
            userRepository.save(user);
        }
        
        // Update the region statistics after eliminating users
        Region region = regionRepository.findById(regionId).orElse(null);
        if (region != null) {
            // Set population to 0 or a very low number
            region.setPopulationCount(0);
            region.setAverageSocialRating(0);
            region.setImportantPersonsCount(0);
            regionRepository.save(region);
        }
    }
    
    /**
     * Recursively updates parent region statistics after a missile strike
     */
    private void updateParentRegionStatistics(String parentRegionId) {
        if (parentRegionId == null || parentRegionId.isEmpty()) {
            return; // No parent to update
        }
        
        Optional<Region> parentOpt = regionRepository.findById(parentRegionId);
        if (parentOpt.isPresent()) {
            Region parent = parentOpt.get();
            
            // Get all sub-regions of this parent
            List<Region> subRegions = regionRepository.findByParentRegionId(parentRegionId);
            
            // Calculate new statistics based on all sub-regions
            int totalPopulation = 0;
            double totalRating = 0;
            int totalImportantPersons = 0;
            
            for (Region subRegion : subRegions) {
                totalPopulation += subRegion.getPopulationCount();
                totalRating += subRegion.getAverageSocialRating() * subRegion.getPopulationCount();
                totalImportantPersons += subRegion.getImportantPersonsCount();
            }
            
            // Update parent region statistics
            parent.setPopulationCount(totalPopulation);
            if (totalPopulation > 0) {
                parent.setAverageSocialRating(totalRating / totalPopulation);
            } else {
                parent.setAverageSocialRating(0);
            }
            parent.setImportantPersonsCount(totalImportantPersons);
            
            // Re-evaluate if the parent should be under threat
            boolean underThreat = shouldDeployOreshnik(parent.getId());
            parent.setUnderThreat(underThreat);
            
            // Save updated parent
            regionRepository.save(parent);
            
            // Notify clients about the region update
            webSocketService.notifyRegionStatusUpdate(parent);
            
            // Continue up the hierarchy
            updateParentRegionStatistics(parent.getParentRegionId());
        }
    }
}
