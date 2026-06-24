package com.taskmanager.backend.controller;

import com.taskmanager.backend.dto.LoginRequest;
import com.taskmanager.backend.dto.RegisterRequest;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // POST: http://localhost:8080/api/auth/signup
    @PostMapping("/signup")
    public ResponseEntity<String> registerUser(@RequestBody RegisterRequest registerRequest) {

        // 1. Validation Guard: Check if username is already taken
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        // 2. Validation Guard: Check if email is already taken
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        // 3. Create new user account mapping from the DTO payload
        // Note: We are saving raw passwords for this split-second test step.
        // We will plug in BCrypt encryption right after we verify the network link!
        User newUser = new User(
                registerRequest.getUsername(),
                registerRequest.getPassword(),
                registerRequest.getEmail()
        );

        userRepository.save(newUser);

        return ResponseEntity.ok("User registered successfully!");
    }

    // POST: http://localhost:8080/api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody LoginRequest loginRequest) {

        // 1. Attempt to locate the user by their unique username
        return userRepository.findByUsername(loginRequest.getUsername())
                .filter(user -> user.getPassword().equals(loginRequest.getPassword()))
                .map(user -> ResponseEntity.ok((Object) user))
                .orElse(ResponseEntity.status(401).body("Error: Invalid username or password!"));
    }
}