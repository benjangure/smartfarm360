package com.smartfarm360.service;

import com.smartfarm360.model.Task;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final TaskRepository taskRepository;
    private final AttendanceRepository attendanceRepository;
    private final CropRepository cropRepository;
    private final LivestockRepository livestockRepository;
    
    public Map<String, Object> getDashboardStats(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }
        
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> stats = new HashMap<>();
        
        User.Role role = user.getRole();
        if (role == User.Role.SYSTEM_ADMIN || role == User.Role.FARM_OWNER) {
            stats = getAdminDashboardStats();
        } else if (role == User.Role.SUPERVISOR) {
            stats = getSupervisorDashboardStats(user);
        } else if (role == User.Role.WORKER) {
            stats = getWorkerDashboardStats(user);
        }
        
        return stats;
    }
    
    public Map<String, Object> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User statistics
        stats.put("totalUsers", userRepository.count());
        stats.put("totalSupervisors", userRepository.countByRole(User.Role.SUPERVISOR));
        stats.put("totalWorkers", userRepository.countByRole(User.Role.WORKER));
        
        // Farm statistics
        stats.put("totalFarms", farmRepository.count());
        
        // Task statistics
        stats.put("totalTasks", taskRepository.count());
        stats.put("pendingTasks", taskRepository.findByStatus(Task.TaskStatus.PENDING).size());
        stats.put("inProgressTasks", taskRepository.findByStatus(Task.TaskStatus.IN_PROGRESS).size());
        stats.put("completedTasks", taskRepository.findByStatus(Task.TaskStatus.COMPLETED).size());
        
        // Attendance statistics
        stats.put("totalAttendanceRecords", attendanceRepository.count());
        
        return stats;
    }
    
    private Map<String, Object> getSupervisorDashboardStats(User supervisor) {
        Map<String, Object> stats = new HashMap<>();
        
        // Tasks created by supervisor
        stats.put("tasksCreated", taskRepository.findByCreatedById(supervisor.getId()).size());
        
        // Farm-related statistics if assigned to a farm
        if (supervisor.getAssignedFarm() != null) {
            Long farmId = supervisor.getAssignedFarm().getId();
            stats.put("farmName", supervisor.getAssignedFarm().getName());
            stats.put("farmTasks", taskRepository.findByFarmId(farmId).size());
            stats.put("farmWorkers", userRepository.findByRoleAndFarmId(User.Role.WORKER, farmId).size());
            stats.put("farmCrops", cropRepository.findByFarmId(farmId).size());
            stats.put("farmLivestock", livestockRepository.findByFarmId(farmId).size());
        } else {
            // Provide default values when no farm is assigned
            stats.put("farmName", null);
            stats.put("farmTasks", 0);
            stats.put("farmWorkers", 0);
            stats.put("farmCrops", 0);
            stats.put("farmLivestock", 0);
        }
        
        return stats;
    }
    
    private Map<String, Object> getWorkerDashboardStats(User worker) {
        Map<String, Object> stats = new HashMap<>();
        
        // Task statistics for worker
        stats.put("totalAssignedTasks", taskRepository.findByAssignedToId(worker.getId()).size());
        stats.put("pendingTasks", taskRepository.countByAssignedToIdAndStatus(worker.getId(), Task.TaskStatus.PENDING));
        stats.put("inProgressTasks", taskRepository.countByAssignedToIdAndStatus(worker.getId(), Task.TaskStatus.IN_PROGRESS));
        stats.put("completedTasks", taskRepository.countByAssignedToIdAndStatus(worker.getId(), Task.TaskStatus.COMPLETED));
        
        // Attendance statistics
        stats.put("totalAttendance", attendanceRepository.findByUserId(worker.getId()).size());
        stats.put("lateAttendance", attendanceRepository.countLateAttendanceByUserId(worker.getId()));
        
        // Farm information if assigned
        if (worker.getAssignedFarm() != null) {
            stats.put("farmName", worker.getAssignedFarm().getName());
        }
        
        return stats;
    }
}