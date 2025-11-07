package com.smartfarm360.repository;

import com.smartfarm360.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    List<Attendance> findByUserId(Long userId);
    
    List<Attendance> findByFarmId(Long farmId);
    
    @Query("SELECT a FROM Attendance a WHERE a.user.id = :userId AND a.status = :status")
    Optional<Attendance> findByUserIdAndStatus(@Param("userId") Long userId, 
                                              @Param("status") Attendance.AttendanceStatus status);
    
    @Query("SELECT a FROM Attendance a WHERE a.user.id = :userId AND DATE(a.checkInTime) = CURRENT_DATE")
    Optional<Attendance> findTodayAttendanceForUser(@Param("userId") Long userId);
    
    @Query("SELECT a FROM Attendance a WHERE a.farm.id = :farmId AND a.checkInTime BETWEEN :startDate AND :endDate")
    List<Attendance> findByFarmIdAndDateRange(@Param("farmId") Long farmId, 
                                             @Param("startDate") LocalDateTime startDate, 
                                             @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a FROM Attendance a WHERE a.user.id = :userId AND a.checkInTime BETWEEN :startDate AND :endDate")
    List<Attendance> findByUserIdAndDateRange(@Param("userId") Long userId, 
                                             @Param("startDate") LocalDateTime startDate, 
                                             @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.farm.id = :farmId AND DATE(a.checkInTime) = CURRENT_DATE")
    long countTodayAttendanceByFarm(@Param("farmId") Long farmId);
    
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.user.id = :userId AND TIME(a.checkInTime) > '09:00:00'")
    long countLateAttendanceByUserId(@Param("userId") Long userId);
    
    @Query("SELECT a FROM Attendance a WHERE a.user.assignedFarm.id = :farmId AND a.checkInTime BETWEEN :startDate AND :endDate")
    List<Attendance> findByUserAssignedFarmIdAndClockInTimeBetween(@Param("farmId") Long farmId, 
                                                                   @Param("startDate") LocalDateTime startDate, 
                                                                   @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a FROM Attendance a WHERE a.checkInTime BETWEEN :startDate AND :endDate")
    List<Attendance> findByClockInTimeBetween(@Param("startDate") LocalDateTime startDate, 
                                             @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a FROM Attendance a WHERE a.user.id = :userId AND a.checkInTime >= :afterDate ORDER BY a.checkInTime DESC")
    List<Attendance> findByUserIdAndCheckInTimeAfter(@Param("userId") Long userId, 
                                                     @Param("afterDate") LocalDateTime afterDate);
}