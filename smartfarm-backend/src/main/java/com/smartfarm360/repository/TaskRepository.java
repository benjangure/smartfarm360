package com.smartfarm360.repository;

import com.smartfarm360.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    
    List<Task> findByAssignedToId(Long userId);
    
    List<Task> findByCreatedById(Long userId);
    
    List<Task> findByFarmId(Long farmId);
    
    List<Task> findByFarmIdAndStatus(Long farmId, Task.TaskStatus status);
    
    List<Task> findByAssignedToIdAndStatus(Long userId, Task.TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.assignedTo.id = :userId AND DATE(t.dueDate) = CURRENT_DATE")
    List<Task> findTodayTasksForUser(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Task t WHERE t.farm.id = :farmId AND t.dueDate BETWEEN :startDate AND :endDate")
    List<Task> findTasksByFarmAndDateRange(@Param("farmId") Long farmId, 
                                          @Param("startDate") LocalDateTime startDate, 
                                          @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignedTo.id = :userId AND t.status = :status")
    long countByAssignedToIdAndStatus(@Param("userId") Long userId, @Param("status") Task.TaskStatus status);
    
    @Query("SELECT COUNT(t) FROM Task t WHERE t.farm.id = :farmId AND t.status = :status")
    long countByFarmIdAndStatus(@Param("farmId") Long farmId, @Param("status") Task.TaskStatus status);
    
    List<Task> findByStatus(Task.TaskStatus status);
    
    @Query("SELECT t FROM Task t WHERE t.farm.id = :farmId AND t.createdAt BETWEEN :startDate AND :endDate")
    List<Task> findByFarmIdAndCreatedAtBetween(@Param("farmId") Long farmId, 
                                              @Param("startDate") LocalDateTime startDate, 
                                              @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT t FROM Task t WHERE t.createdAt BETWEEN :startDate AND :endDate")
    List<Task> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    List<Task> findByCreatedByIdAndFarmId(Long createdById, Long farmId);
    
    List<Task> findByAssignedToIdOrderByCreatedAtDesc(Long userId);
}