
package melo_backend.controller;

import java.util.Locale;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import melo_backend.model.User;
import melo_backend.repository.UserRepository;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    private static final Set<String> PUBLIC_REGISTRATION_ROLES =
            Set.of("listener", "artist");

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (user.getName() == null || user.getName().isBlank()
                || user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Name, email, and password are required");
        }

        if (user.getRole() == null) {
            return ResponseEntity
                    .badRequest()
                    .body("Please select Listener or Artist");
        }

        String requestedRole = user.getRole()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (!PUBLIC_REGISTRATION_ROLES.contains(requestedRole)) {
            return ResponseEntity
                    .badRequest()
                    .body("Public registration is allowed for Listener and Artist only");
        }

        user.setRole(requestedRole);

        if (userRepository.findByEmail(user.getEmail().trim()).isPresent()) {
            return ResponseEntity
                    .badRequest()
                    .body("Email already registered");
        }

        user.setEmail(user.getEmail().trim());

        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {

        var existingUser = userRepository.findByEmail(user.getEmail());

        if (existingUser.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body("Invalid email or password");
        }

        User foundUser = existingUser.get();

        if (!foundUser.getPassword().equals(user.getPassword())) {
            return ResponseEntity
                    .badRequest()
                    .body("Invalid email or password");
        }

        return ResponseEntity.ok(foundUser);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {

        if (!userRepository.existsById(id)) {
            return ResponseEntity
                    .badRequest()
                    .body("User not found");
        }

        userRepository.deleteById(id);

        return ResponseEntity.ok("User deleted successfully");
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestParam String role) {

        var existingUser = userRepository.findById(id);

        if (existingUser.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body("User not found");
        }

        User user = existingUser.get();

        user.setRole(role);

        userRepository.save(user);

        return ResponseEntity.ok("User role updated successfully");
    }
}
