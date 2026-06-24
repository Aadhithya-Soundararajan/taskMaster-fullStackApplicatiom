package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.Domain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DomainRepository extends JpaRepository<Domain, Long> {
    // Basic CRUD operations are instantly inherited out-of-the-box!
}