package com.taskmanager.backend.config;

import com.taskmanager.backend.model.Domain;
import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.model.User;
import com.taskmanager.backend.repository.DomainRepository;
import com.taskmanager.backend.repository.TaskRepository;
import com.taskmanager.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.Duration;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final DomainRepository domainRepository;
    private final TaskRepository taskRepository;

    public DataInitializer(DomainRepository domainRepository, TaskRepository taskRepository,UserRepository userRepository) {
        this.domainRepository = domainRepository;
        this.taskRepository = taskRepository;
        this.userRepository=userRepository;
    }

    @Override
    public void run(String... args) throws Exception {

        //1. Seed a default user profile
        User defaultUser=new User("aadhi","aadhi123","aadhi123@gmail.com");
        User savedUser=userRepository.save(defaultUser);
        // 2. Seed Sample Workspace Domains
        Domain academicDomain = new Domain("Academics", "#3B82F6", "🎓");
        Domain personalDomain = new Domain("Personal", "#10B981", "🏠");

        academicDomain.setUser(savedUser);
        personalDomain.setUser(savedUser);
        domainRepository.save(academicDomain    );
        domainRepository.save(personalDomain);

        // 3. Seed Your Frontend's Mock Task
        // Inside your DataInitializer.java where you save tasks:

// 1. A classic One-Time Task
        Task assignmentTask = new Task();
        assignmentTask.setTitle("Finish DSA Assignment");
        assignmentTask.setDescription("Graph theory implementation and Ford-Fulkerson algorithm analysis.");
        assignmentTask.setStatus("PENDING");
        assignmentTask.setPriority("High");
        assignmentTask.setDueDate(Instant.now().plus(Duration.ofDays(3))); // Due in 3 days
        assignmentTask.setTaskType("ONETIME");
        assignmentTask.setFrequency(null);
        assignmentTask.setRecurrenceDays(null);
        assignmentTask.setUser(defaultUser);
        assignmentTask.setDomain(academicDomain);
        taskRepository.save(assignmentTask);

// 2. A Daily Habit Task
        Task gymTask = new Task();
        gymTask.setTitle("Evening Gym Session");
        gymTask.setDescription("Push day workout routine.");
        gymTask.setStatus("PENDING");
        gymTask.setPriority("Medium");
        gymTask.setDueDate(null); // Recurring habits don't need fixed due dates!
        gymTask.setTaskType("RECURRING");
        gymTask.setFrequency("DAILY");
        gymTask.setRecurrenceDays(null);
        gymTask.setUser(defaultUser);
        gymTask.setDomain(personalDomain);
        taskRepository.save(gymTask);

// 3. A Custom Weekly Routine Task
        Task labPrepTask = new Task();
        labPrepTask.setTitle("Review Networking Lab Experiments");
        labPrepTask.setDescription("Go over CSMA/CD protocols and routing table configurations.");
        labPrepTask.setStatus("PENDING");
        labPrepTask.setPriority("Low");
        labPrepTask.setDueDate(null);
        labPrepTask.setTaskType("RECURRING");
        labPrepTask.setFrequency("CUSTOM");
        labPrepTask.setRecurrenceDays("MON,WED,FRI"); // Runs 3 days a week
        labPrepTask.setUser(defaultUser);
        labPrepTask.setDomain(academicDomain);
        taskRepository.save(labPrepTask);

        System.out.println(">> Relational Database Seeded Successfully With Mock Data!");
    }
}