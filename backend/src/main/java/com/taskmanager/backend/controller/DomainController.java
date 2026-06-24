package com.taskmanager.backend.controller;

import com.taskmanager.backend.model.Domain;
import com.taskmanager.backend.service.DomainService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/domains")
@CrossOrigin(origins = "*")
public class DomainController {

    private final DomainService domainService;

    public DomainController(DomainService domainService) {
        this.domainService = domainService;
    }

    // GET: http://localhost:8080/api/domains
    @GetMapping
    public List<Domain> getAllDomains() {
        return domainService.getAllDomains();
    }

    // NEW GET: http://localhost:8080/api/domains/user/1
    // Essential for the frontend to render only the active user's workspace categories
    @GetMapping("/user/{userId}")
    public List<Domain> getDomainsByUserId(@PathVariable Long userId) {
        return domainService.getDomainsByUserId(userId);
    }

    // POST: http://localhost:8080/api/domains
    @PostMapping
    public ResponseEntity<Domain> createDomain(@RequestBody Domain domain) {
        // Validation Guard: Ensure a domain workspace isn't created without an owner
        if (domain.getUser() == null || domain.getUser().getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        Domain savedDomain = domainService.saveOrUpdateDomain(domain);
        return ResponseEntity.ok(savedDomain);
    }

    // DELETE: http://localhost:8080/api/domains/1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDomain(@PathVariable Long id) {
        if (domainService.getDomainById(id).isPresent()) {
            domainService.deleteDomain(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}