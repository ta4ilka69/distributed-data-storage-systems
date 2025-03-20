package itmo.rshd.service;

import itmo.rshd.model.GeoLocation;
import itmo.rshd.model.Region;
import itmo.rshd.model.Region.RegionType;
import itmo.rshd.model.User;
import itmo.rshd.repository.RegionRepository;
import itmo.rshd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RegionService {

    private final RegionRepository regionRepository;
    private final UserRepository userRepository;
    private final RegionAssessmentService regionAssessmentService;

    @Autowired
    public RegionService(RegionRepository regionRepository, UserRepository userRepository, RegionAssessmentService regionAssessmentService) {
        this.regionRepository = regionRepository;
        this.userRepository = userRepository;
        this.regionAssessmentService = regionAssessmentService;
    }

    public Region createRegion(Region region) {
        return regionRepository.save(region);
    }

    public List<Region> getAllRegions() {
        return regionRepository.findAll();
    }

    public Optional<Region> getRegionById(String id) {
        return regionRepository.findById(id);
    }

    public Region updateRegion(Region region) {
        return regionRepository.save(region);
    }

    public void deleteRegion(String id) {
        regionRepository.deleteById(id);
    }

    public List<Region> findRegionsByType(RegionType type) {
        return regionRepository.findByType(type);
    }

    public List<Region> findSubRegions(String parentRegionId) {
        return regionRepository.findByParentRegionId(parentRegionId);
    }

    public List<Region> findRegionsContainingPoint(GeoLocation location) {
        return regionRepository.findRegionsContainingPoint(location.getLongitude(), location.getLatitude());
    }

    public List<Region> findLowRatedRegionsWithoutImportantPersons(double threshold) {
        return regionRepository.findLowRatedRegionsWithoutImportantPersons(threshold);
    }

    public Region updateRegionStatistics(String regionId) {
        Optional<Region> regionOpt = regionRepository.findById(regionId);
        if (regionOpt.isPresent()) {
            Region region = regionOpt.get();
            List<User> usersInRegion = userRepository.findByRegionId(regionId);
            
            if (!usersInRegion.isEmpty()) {
                // Calculate average social rating
                double totalRating = 0;
                for (User user : usersInRegion) {
                    totalRating += user.getSocialRating();
                }
                region.setAverageSocialRating(totalRating / usersInRegion.size());
                region.setPopulationCount(usersInRegion.size());
                
                // Count important persons
                List<User> importantPersons = userRepository.findImportantPersonsInRegion(regionId);
                region.setImportantPersonsCount(importantPersons.size());
                
                // Use RegionAssessmentService to determine if this region should be under threat
                boolean underThreat = regionAssessmentService.shouldDeployOreshnik(region.getId());
                region.setUnderThreat(underThreat);
                
                return regionRepository.save(region);
            }
        }
        return null;
    }

    public List<Region> updateAllRegionsStatistics() {
        List<Region> allRegions = regionRepository.findAll();
        List<Region> updatedRegions = new java.util.ArrayList<>();
        
        for (Region region : allRegions) {
            Region updatedRegion = updateRegionStatistics(region.getId());
            if (updatedRegion != null) {
                updatedRegions.add(updatedRegion);
            }
        }
        
        return updatedRegions;
    }

    public List<Region> findRegionsUnderThreat(RegionType type) {
        return regionRepository.findRegionsUnderThreat(type);
    }
} 