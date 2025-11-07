package com.smartfarm360.service;

import com.smartfarm360.dto.TaskRequest;
import com.smartfarm360.dto.TaskUpdateRequest;
import com.smartfarm360.model.Farm;
import com.smartfarm360.model.Task;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.TaskRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final EmailServiceHTML emailService;
    
    @Transactional
    public Task createTask(TaskRequest request, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Creator not found"));
        
        User assignedUser = userRepository.findById(request.getAssignedToId())
                .orElseThrow(() -> new RuntimeException("Assigned user not found"));
        
        // Validate that creator can assign tasks to this user
        validateTaskAssignmentPermission(creator, assignedUser);
        
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setCategory(request.getCategory());
        task.setAssignedTo(assignedUser);
        task.setCreatedBy(creator);
        // Set the farm - supervisor assigns tasks within their assigned farm
        Farm taskFarm = creator.getAssignedFarm();
        
        if (taskFarm == null) {
            throw new RuntimeException("Supervisor must be assigned to a farm to create tasks");
        }
        
        task.setFarm(taskFarm);
        task.setDueDate(request.getDueDateAsDateTime());
        task.setPriority(request.getPriority());
        task.setEstimatedHours(request.getEstimatedHours());
        task.setStatus(Task.TaskStatus.PENDING);
        
        Task savedTask = taskRepository.save(task);
        
        log.info("Task saved with ID: {}, createdBy: {}, farm: {}, assignedTo: {}", 
                savedTask.getId(), 
                savedTask.getCreatedBy().getId(), 
                savedTask.getFarm() != null ? savedTask.getFarm().getId() : "null",
                savedTask.getAssignedTo().getId());
        
        // Send task assignment email
        try {
            emailService.sendTaskAssignmentEmail(
                assignedUser.getEmail(),
                assignedUser.getFirstName() + " " + assignedUser.getLastName(),
                task.getTitle(),
                task.getDueDate() != null ? task.getDueDate().toString() : "No due date"
            );
        } catch (Exception e) {
            log.warn("Failed to send task assignment email: {}", e.getMessage());
        }
        
        log.info("Task created: {} assigned to {}", task.getTitle(), assignedUser.getUsername());
        return savedTask;
    }
    
    public List<Task> getTasksForCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        switch (user.getRole()) {
            case SUPERVISOR:
                // Supervisor can see tasks they created in their assigned farm
                if (user.getAssignedFarm() != null) {
                    return taskRepository.findByCreatedByIdAndFarmId(user.getId(), user.getAssignedFarm().getId());
                }
                return List.of();
            case WORKER:
                // Worker can ONLY see their own assigned tasks
                return taskRepository.findByAssignedToId(user.getId());
            default:
                // Only supervisors and workers can access tasks
                return List.of();
        }
    }
    
    public List<Task> getTodayTasksForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return taskRepository.findTodayTasksForUser(user.getId());
    }
    
    public List<Task> getTasksAssignedToUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        log.info("Looking for tasks assigned to user: {} (ID: {})", username, user.getId());
        
        // Return tasks specifically assigned to this user
        List<Task> tasks = taskRepository.findByAssignedToId(user.getId());
        
        log.info("Found {} tasks assigned to user ID: {}", tasks.size(), user.getId());
        
        if (tasks.isEmpty()) {
            log.warn("No tasks found for user: {} (ID: {}). Check if tasks are properly assigned in database.", username, user.getId());
        }
        
        return tasks;
    }
    
    public List<Task> getTasksCreatedByUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        log.info("Looking for tasks created by user ID: {} ({})", user.getId(), username);
        log.info("User assigned farm: {}", user.getAssignedFarm() != null ? user.getAssignedFarm().getId() : "null");
        
        // Return tasks created by this user (for supervisors)
        // Use the same logic as getTasksForCurrentUser for consistency
        if (user.getRole() == User.Role.SUPERVISOR && user.getAssignedFarm() != null) {
            List<Task> tasks = taskRepository.findByCreatedByIdAndFarmId(user.getId(), user.getAssignedFarm().getId());
            log.info("Found {} tasks created by user in farm: {}", tasks.size(), username);
            return tasks;
        } else {
            // Fallback to all tasks created by user (for debugging)
            List<Task> tasks = taskRepository.findByCreatedById(user.getId());
            log.info("Found {} tasks created by user (no farm filter): {}", tasks.size(), username);
            return tasks;
        }
    }
    
    @Transactional
    public Task updateTaskStatus(Long taskId, TaskUpdateRequest request, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Validate permission to update task
        if (!canUpdateTask(user, task)) {
            throw new RuntimeException("You don't have permission to update this task");
        }
        
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
            
            // Set timestamps based on status
            if (request.getStatus() == Task.TaskStatus.IN_PROGRESS && task.getStartedAt() == null) {
                task.setStartedAt(LocalDateTime.now());
            } else if (request.getStatus() == Task.TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            }
        }
        
        if (request.getCompletionNotes() != null) {
            task.setCompletionNotes(request.getCompletionNotes());
        }
        
        if (request.getActualHours() != null) {
            task.setActualHours(request.getActualHours());
        }
        
        if (request.getPhotoUrl() != null) {
            task.setPhotoUrl(request.getPhotoUrl());
        }
        
        if (request.getReasonForDelay() != null) {
            task.setReasonForDelay(request.getReasonForDelay());
        }
        
        if (request.getEstimatedCompletionDate() != null) {
            try {
                // Parse the date string to LocalDateTime
                task.setEstimatedCompletionDate(LocalDateTime.parse(request.getEstimatedCompletionDate() + "T00:00:00"));
            } catch (Exception e) {
                log.warn("Failed to parse estimated completion date: {}", request.getEstimatedCompletionDate());
            }
        }
        
        Task updatedTask = taskRepository.save(task);
        
        // Notify supervisor/farm owner of task completion
        if (request.getStatus() == Task.TaskStatus.COMPLETED) {
            try {
                emailService.sendTaskCompletionNotificationEmail(
                    task.getCreatedBy().getEmail(),
                    task.getCreatedBy().getFirstName() + " " + task.getCreatedBy().getLastName(),
                    task.getTitle(),
                    task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName()
                );
            } catch (Exception e) {
                log.warn("Failed to send task completion notification: {}", e.getMessage());
            }
        }
        
        return updatedTask;
    }
    
    public Optional<Task> getTaskById(Long taskId) {
        return taskRepository.findById(taskId);
    }
    
    @Transactional
    public void deleteTask(Long taskId, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Only the supervisor who created the task can delete it
        if (!task.getCreatedBy().getId().equals(user.getId()) || 
            user.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("Only the supervisor who created this task can delete it");
        }
        
        taskRepository.delete(task);
    }
    
    private void validateTaskAssignmentPermission(User creator, User assignedUser) {
        // Only supervisors can assign tasks
        if (creator.getRole() != User.Role.SUPERVISOR) {
            throw new RuntimeException("Only supervisors can assign tasks");
        }
        
        // Supervisor can ONLY assign to workers in their specific assigned farm
        boolean canAssign = creator.getAssignedFarm() != null && 
                           assignedUser.getAssignedFarm() != null &&
                           creator.getAssignedFarm().getId().equals(assignedUser.getAssignedFarm().getId()) &&
                           assignedUser.getRole() == User.Role.WORKER;
        
        if (!canAssign) {
            throw new RuntimeException("You can only assign tasks to workers in your assigned farm");
        }
    }
    
    private boolean canUpdateTask(User user, Task task) {
        // Task creator (supervisor) can update
        // Assigned user (worker) can update their own task
        return (task.getCreatedBy().getId().equals(user.getId()) && user.getRole() == User.Role.SUPERVISOR) ||
               task.getAssignedTo().getId().equals(user.getId());
    }
    
    public java.util.Map<String, Object> getTaskStatistics(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Task> tasks;
        
        // Get tasks based on user role
        if (user.getRole() == User.Role.WORKER) {
            tasks = taskRepository.findByAssignedToId(user.getId());
        } else if (user.getRole() == User.Role.SUPERVISOR && user.getAssignedFarm() != null) {
            tasks = taskRepository.findByCreatedByIdAndFarmId(user.getId(), user.getAssignedFarm().getId());
        } else {
            tasks = List.of();
        }
        
        // Count tasks by status
        long total = tasks.size();
        long pending = tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.PENDING).count();
        long inProgress = tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.IN_PROGRESS).count();
        long completed = tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED).count();
        long notDone = tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.NOT_DONE).count();
        long toBeDoneLater = tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.TO_BE_DONE_LATER).count();
        long cancelled = tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.CANCELLED).count();
        
        // Count overdue tasks (pending or in progress past due date)
        LocalDateTime now = LocalDateTime.now();
        long overdue = tasks.stream()
                .filter(t -> (t.getStatus() == Task.TaskStatus.PENDING || t.getStatus() == Task.TaskStatus.IN_PROGRESS))
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(now))
                .count();
        
        // Count today's tasks
        long today = tasks.stream()
                .filter(t -> t.getDueDate() != null)
                .filter(t -> t.getDueDate().toLocalDate().equals(now.toLocalDate()))
                .count();
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("inProgress", inProgress);
        stats.put("completed", completed);
        stats.put("notDone", notDone);
        stats.put("toBeDoneLater", toBeDoneLater);
        stats.put("cancelled", cancelled);
        stats.put("overdue", overdue);
        stats.put("today", today);
        
        log.info("Task statistics for {}: total={}, pending={}, inProgress={}, completed={}", 
                username, total, pending, inProgress, completed);
        
        return stats;
    }
    
    public List<Task> getTasksByWorkerId(Long workerId, String requesterUsername) {
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new RuntimeException("Requester not found"));
        
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        // Validate permission: only supervisors/farm owners can view worker tasks
        if (requester.getRole() == User.Role.SUPERVISOR) {
            // Supervisor can only view tasks for workers in their farm
            if (worker.getAssignedFarm() == null || requester.getAssignedFarm() == null ||
                !worker.getAssignedFarm().getId().equals(requester.getAssignedFarm().getId())) {
                throw new RuntimeException("You don't have permission to view this worker's tasks");
            }
        } else if (requester.getRole() == User.Role.FARM_OWNER) {
            // Farm owner can view tasks for workers in their farms
            boolean hasAccess = requester.getOwnedFarms().stream()
                    .anyMatch(farm -> worker.getAssignedFarm() != null && 
                             farm.getId().equals(worker.getAssignedFarm().getId()));
            if (!hasAccess) {
                throw new RuntimeException("You don't have permission to view this worker's tasks");
            }
        } else if (requester.getRole() != User.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("You don't have permission to view worker tasks");
        }
        
        return taskRepository.findByAssignedToIdOrderByCreatedAtDesc(workerId);
    }
}