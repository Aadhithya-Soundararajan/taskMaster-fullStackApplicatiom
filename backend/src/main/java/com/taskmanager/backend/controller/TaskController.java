package com.taskmanager.backend.controller;

import com.taskmanager.backend.model.Task;
import com.taskmanager.backend.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*") // Allows your frontend IDE window to talk to this backend without CORS blocks
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    // GET: http://localhost:8080/api/tasks
    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    // GET: http://localhost:8080/api/tasks/user/1
    @GetMapping("/user/{userId}")
    public List<Task> getTasksByUserId(@PathVariable Long userId) {
        return taskService.getTasksByUserId(userId);
    }

    // GET: http://localhost:8080/api/tasks/101
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST: http://localhost:8080/api/tasks
    @PostMapping
    public Task createTask(@RequestBody Task task) {
        return taskService.saveOrUpdateTask(task);
    }

    // PUT: http://localhost:8080/api/tasks/101
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        return taskService.getTaskById(id).map(existingTask -> {
            existingTask.setTitle(taskDetails.getTitle());
            existingTask.setDescription(taskDetails.getDescription());
            existingTask.setStatus(taskDetails.getStatus());
            existingTask.setPriority(taskDetails.getPriority());
            existingTask.setDueDate(taskDetails.getDueDate());
            existingTask.setCompletedAt(taskDetails.getCompletedAt());
            existingTask.setDomain(taskDetails.getDomain());

            Task updatedTask = taskService.saveOrUpdateTask(existingTask);
            return ResponseEntity.ok(updatedTask);
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE: http://localhost:8080/api/tasks/101
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        if (taskService.getTaskById(id).isPresent()) {
            taskService.deleteTask(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}