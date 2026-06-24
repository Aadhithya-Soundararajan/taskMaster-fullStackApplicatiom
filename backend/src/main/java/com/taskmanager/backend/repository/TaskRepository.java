package com.taskmanager.backend.repository;

import com.taskmanager.backend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    // Custom query: Spring automatically handles "SELECT * FROM tasks WHERE user_id = ?"
    List<Task> findByUserId(Long userId);

    // Custom query: Spring automatically handles "SELECT * FROM tasks WHERE domain_id = ?"
    List<Task> findByDomainId(Long domainId);
}