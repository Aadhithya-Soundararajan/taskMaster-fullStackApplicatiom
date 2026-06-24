package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // This gives us built-in database operations like .save(), .findById(), etc.
    // Used to check if a username is already registered
    Optional<User> findByUsername(String username);

    // Used to check if an email is already registered
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}