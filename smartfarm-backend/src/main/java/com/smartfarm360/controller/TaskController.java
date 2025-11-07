package com.smartfarm360.controller;

import com.smartfarm360.dto.TaskRequest;
import com.smartfarm360.dto.TaskUpdateRequest;
import com.smartfarm360.model.Task;
import com.smartfarm360.service.TaskService;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Task Management", description = "Task management APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class TaskController {
    
    private final TaskService taskService;
    
    @PostMapping
    @Operation(summary = "Create task", description = "Create a new task and assign to a user")
    public ResponseEntity<?> createTask(@Valid @RequestBody TaskRequest request, Authentication authentication) {
        try {
            log.info("Creating task: {} for user: {}", request.getTitle(), authentication.getName());
            log.info("Task request details: assignedToId={}, dueDate={}, priority={}", 
                    request.getAssignedToId(), request.getDueDate(), request.getPriority());
            
            Task createdTask = taskService.createTask(request, authentication.getName());
            log.info("Task created successfully with ID: {}", createdTask.getId());
            
            return ResponseEntity.ok().body(Map.of(
                "message", "Task created successfully and assigned to user",
                "taskId", createdTask.getId(),
                "success", true
            ));
        } catch (RuntimeException e) {
            log.error("Error creating task: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "success", false
            ));
        } catch (Exception e) {
            log.error("Unexpected error creating task: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Internal server error: " + e.getMessage(),
                "success", false
            ));
        }
    }
    
    @GetMapping
    @Operation(summary = "Get tasks", description = "Get tasks based on user role")
    public ResponseEntity<List<Task>> getTasks(Authentication authentication) {
        List<Task> tasks = taskService.getTasksForCurrentUser(authentication.getName());
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/today")
    @Operation(summary = "Get today's tasks", description = "Get tasks due today for current user")
    public ResponseEntity<List<Task>> getTodayTasks(Authentication authentication) {
        List<Task> tasks = taskService.getTodayTasksForUser(authentication.getName());
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/my-tasks")
    @Operation(summary = "Get my tasks", description = "Get all tasks assigned to current user")
    public ResponseEntity<List<Task>> getMyTasks(Authentication authentication) {
        log.info("Getting tasks for user: {}", authentication.getName());
        List<Task> tasks = taskService.getTasksAssignedToUser(authentication.getName());
        log.info("Found {} tasks for user: {}", tasks.size(), authentication.getName());
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/stats")
    @Operation(summary = "Get task statistics", description = "Get task count by status for current user")
    public ResponseEntity<Map<String, Object>> getTaskStats(Authentication authentication) {
        log.info("Getting task statistics for user: {}", authentication.getName());
        Map<String, Object> stats = taskService.getTaskStatistics(authentication.getName());
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/created-by-me")
    @Operation(summary = "Get tasks created by me", description = "Get all tasks created by current supervisor")
    public ResponseEntity<List<Task>> getTasksCreatedByMe(Authentication authentication) {
        log.info("Getting tasks created by user: {}", authentication.getName());
        List<Task> tasks = taskService.getTasksCreatedByUser(authentication.getName());
        log.info("Found {} tasks created by user: {}", tasks.size(), authentication.getName());
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/worker/{workerId}")
    @Operation(summary = "Get tasks by worker", description = "Get all tasks assigned to a specific worker")
    public ResponseEntity<List<Task>> getTasksByWorker(@PathVariable Long workerId, Authentication authentication) {
        log.info("Getting tasks for worker ID: {} requested by: {}", workerId, authentication.getName());
        List<Task> tasks = taskService.getTasksByWorkerId(workerId, authentication.getName());
        log.info("Found {} tasks for worker ID: {}", tasks.size(), workerId);
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID", description = "Get task details by ID")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update task", description = "Update task status, notes, or completion details")
    public ResponseEntity<?> updateTask(@PathVariable Long id, 
                                       @RequestBody TaskUpdateRequest request, 
                                       Authentication authentication) {
        try {
            Task task = taskService.updateTaskStatus(id, request, authentication.getName());
            return ResponseEntity.ok(task);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "success", false
            ));
        }
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete task", description = "Delete a task")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Authentication authentication) {
        try {
            taskService.deleteTask(id, authentication.getName());
            return ResponseEntity.ok().body(Map.of(
                "message", "Task deleted successfully",
                "success", true
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage(),
                "success", false
            ));
        }
    }
}