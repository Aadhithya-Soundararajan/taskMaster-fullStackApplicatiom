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

    // POST: http://localhost:8080/api/domains
    @PostMapping
    public Domain createDomain(@RequestBody Domain domain) {
        return domainService.saveOrUpdateDomain(domain);
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