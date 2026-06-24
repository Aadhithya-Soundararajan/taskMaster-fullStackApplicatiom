package com.taskmanager.backend.service;

import com.taskmanager.backend.model.Domain;
import com.taskmanager.backend.repository.DomainRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DomainService {

    private final DomainRepository domainRepository;

    public DomainService(DomainRepository domainRepository) {
        this.domainRepository = domainRepository;
    }

    public List<Domain> getAllDomains() {
        return domainRepository.findAll();
    }

    public List<Domain> getDomainsByUserId(Long userId) {
        return domainRepository.findByUserId(userId);
    }

    public Domain saveOrUpdateDomain(Domain domain) {
        return domainRepository.save(domain);
    }

    public Optional<Domain> getDomainById(Long id) {
        return domainRepository.findById(id);
    }

    public void deleteDomain(Long id) {
        domainRepository.deleteById(id);
    }
}