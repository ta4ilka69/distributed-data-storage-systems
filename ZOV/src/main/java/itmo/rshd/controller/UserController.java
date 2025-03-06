package itmo.rshd.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import itmo.rshd.model.Location;
import itmo.rshd.model.User;
import itmo.rshd.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
    }
    
    @PutMapping("/{id}/location")
    public User updateLocation(@PathVariable String id, @RequestBody Location location) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setCurrentLocation(location);
        return userRepository.save(user);
    }
    
    @PutMapping("/{id}/rating")
    public User updateRating(@PathVariable String id, @RequestParam Double rating) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setSocialRating(rating);
        return userRepository.save(user);
    }
}