package com.smartfarm360.service;

import com.smartfarm360.dto.WorkerStatsResponse;
import com.smartfarm360.model.Attendance;
import com.smartfarm360.model.Task;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.AttendanceRepository;
import com.smartfarm360.repository.TaskRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkerStatsService {
    
    private final TaskRepository taskRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    
    public WorkerStatsResponse getWorkerStats(Long workerId) {
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        if (worker.getRole() != User.Role.WORKER) {
            throw new RuntimeException("User is not a worker");
        }
        
        WorkerStatsResponse stats = new WorkerStatsResponse();
        stats.setWorkerId(workerId);
        
        // Task Statistics
        List<Task> allTasks = taskRepository.findByAssignedToId(workerId);
        stats.setTotalTasks(allTasks.size());
        
        long completedCount = allTasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED)
                .count();
        stats.setCompletedTasks((int) completedCount);
        
        long pendingCount = allTasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.PENDING)
                .count();
        stats.setPendingTasks((int) pendingCount);
        
        long inProgressCount = allTasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.IN_PROGRESS)
                .count();
        stats.setInProgressTasks((int) inProgressCount);
        
        // Calculate completion rate
        if (allTasks.size() > 0) {
            double completionRate = (completedCount * 100.0) / allTasks.size();
            stats.setCompletionRate(Math.round(completionRate * 10.0) / 10.0); // Round to 1 decimal
        } else {
            stats.setCompletionRate(0.0);
        }
        
        // Calculate average task completion time
        List<Task> completedTasks = allTasks.stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.COMPLETED && 
                           t.getCreatedAt() != null && 
                           t.getCompletedAt() != null)
                .toList();
        
        if (!completedTasks.isEmpty()) {
            double avgHours = completedTasks.stream()
                    .mapToDouble(t -> {
                        long hours = ChronoUnit.HOURS.between(t.getCreatedAt(), t.getCompletedAt());
                        return hours;
                    })
                    .average()
                    .orElse(0.0);
            stats.setAverageTaskCompletionTime(Math.round(avgHours * 10.0) / 10.0);
        } else {
            stats.setAverageTaskCompletionTime(0.0);
        }
        
        // Attendance Statistics (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Attendance> recentAttendance = attendanceRepository.findByUserIdAndCheckInTimeAfter(
                workerId, thirtyDaysAgo);
        
        stats.setPresentDays(recentAttendance.size());
        
        // Calculate total working days (excluding weekends for simplicity)
        long totalWorkingDays = calculateWorkingDays(thirtyDaysAgo.toLocalDate(), LocalDate.now());
        stats.setTotalAttendanceDays((int) totalWorkingDays);
        
        // Calculate attendance rate
        if (totalWorkingDays > 0) {
            double attendanceRate = (recentAttendance.size() * 100.0) / totalWorkingDays;
            stats.setAttendanceRate(Math.round(attendanceRate * 10.0) / 10.0);
        } else {
            stats.setAttendanceRate(0.0);
        }
        
        // Last Active (most recent attendance or task update)
        LocalDateTime lastActive = null;
        
        if (!recentAttendance.isEmpty()) {
            lastActive = recentAttendance.stream()
                    .map(Attendance::getCheckInTime)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
        }
        
        if (!allTasks.isEmpty()) {
            LocalDateTime lastTaskUpdate = allTasks.stream()
                    .map(Task::getUpdatedAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
            
            if (lastActive == null || (lastTaskUpdate != null && lastTaskUpdate.isAfter(lastActive))) {
                lastActive = lastTaskUpdate;
            }
        }
        
        if (lastActive != null) {
            stats.setLastActive(lastActive.format(DateTimeFormatter.ISO_LOCAL_DATE));
        } else {
            stats.setLastActive("Never");
        }
        
        log.info("Worker stats calculated for worker {}: completion={}%, attendance={}%", 
                workerId, stats.getCompletionRate(), stats.getAttendanceRate());
        
        return stats;
    }
    
    private long calculateWorkingDays(LocalDate startDate, LocalDate endDate) {
        long workingDays = 0;
        LocalDate current = startDate;
        
        while (!current.isAfter(endDate)) {
            // Skip weekends (Saturday = 6, Sunday = 7)
            if (current.getDayOfWeek().getValue() < 6) {
                workingDays++;
            }
            current = current.plusDays(1);
        }
        
        return workingDays;
    }
}
