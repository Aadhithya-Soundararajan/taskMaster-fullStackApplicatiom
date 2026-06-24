package com.taskmanager.backend.service;

import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    // Dependency Injection: Spring automatically passes in our database engine
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    // Fetch all tasks globally
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    // Fetch tasks belonging to a specific user
    public List<Task> getTasksByUserId(Long userId) {
        return taskRepository.findByUserId(userId);
    }

    // Save a new task or update an existing one
    public Task saveOrUpdateTask(Task task) {
        return taskRepository.save(task);
    }

    // Delete a task by its ID
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    // Fetch a single task by ID safely using Optional
    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }
}