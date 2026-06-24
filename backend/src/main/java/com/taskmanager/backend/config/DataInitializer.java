package com.taskmanager.backend.config;

import com.taskmanager.backend.model.Domain;
import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.repository.DomainRepository;
import com.taskmanager.backend.repository.TaskRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataInitializer implements CommandLineRunner {

    private final DomainRepository domainRepository;
    private final TaskRepository taskRepository;

    public DataInitializer(DomainRepository domainRepository, TaskRepository taskRepository) {
        this.domainRepository = domainRepository;
        this.taskRepository = taskRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Sample Workspace Domains
        Domain collegeDomain = new Domain("Academics", "#3B82F6", "🎓");
        Domain personalDomain = new Domain("Personal", "#10B981", "🏠");

        domainRepository.save(collegeDomain);
        domainRepository.save(personalDomain);

        // 2. Seed Your Frontend's Mock Task
        Task dsaTask = new Task(
                1L, // user_id
                "Finish DSA Assignment", // title
                "Complete the graph theory implementation problems and submit on the student portal.", // description
                "Pending", // status
                "High", // priority
                Instant.parse("2026-06-23T23:59:59Z"), // due_date
                collegeDomain // Relational link to the Academics Domain
        );

        // Explicitly set the custom timestamps to match your exact frontend mock record
        dsaTask.setCreatedAt(Instant.parse("2026-06-22T10:00:00Z"));
        dsaTask.setUpdatedAt(Instant.parse("2026-06-22T14:30:00Z"));

        taskRepository.save(dsaTask);

        System.out.println(">> Relational Database Seeded Successfully With Mock Data!");
    }
}