package itmo.rshd.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import itmo.rshd.model.User;
import itmo.rshd.repository.UserRepository;

@Service
public class RegionAssessmentService {

    @Autowired
    private UserRepository userRepository;

    public boolean shouldDeployOreshnik(String region) {
        Double averageRating = userRepository.calculateAverageRatingInRegion(region);
        List<User> veryImportantPeople = userRepository.findVeryImportantPeopleInRegion(region);

        return averageRating != null &&
                averageRating < 2.0 && // Threshold for "very bad" rating
                veryImportantPeople.isEmpty();
    }

    public void deployOreshnik(String region) {
        if (shouldDeployOreshnik(region)) {
            // Implementation of missile deployment logic
            // This is where you'd integrate with your missile control system
            System.out.println("ORESHNIK deployed to region: " + region);
        }
    }
}
