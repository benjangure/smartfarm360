package com.smartfarm360.service;

import com.smartfarm360.dto.CheckInRequest;
import com.smartfarm360.dto.CheckOutRequest;
import com.smartfarm360.model.Attendance;
import com.smartfarm360.model.Farm;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.AttendanceRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {
    
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    
    // Configurable work start time (8:00 AM by default)
    private static final int WORK_START_HOUR = 8;
    private static final int WORK_START_MINUTE = 0;
    // Grace period in minutes (e.g., 15 minutes late is acceptable)
    private static final int LATE_GRACE_PERIOD_MINUTES = 15;
    
    @Transactional
    public Attendance checkIn(CheckInRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if user is already checked in today
        Optional<Attendance> todayAttendance = attendanceRepository.findTodayAttendanceForUser(user.getId());
        if (todayAttendance.isPresent() && todayAttendance.get().getStatus() == Attendance.AttendanceStatus.CHECKED_IN) {
            throw new RuntimeException("You are already checked in today");
        }
        
        // Check if user has a farm assigned
        if (user.getAssignedFarm() == null) {
            throw new RuntimeException("No farm assigned to user");
        }
        
        LocalDateTime checkInTime = LocalDateTime.now();
        
        Attendance attendance = new Attendance();
        attendance.setUser(user);
        attendance.setFarm(user.getAssignedFarm());
        attendance.setCheckInTime(checkInTime);
        attendance.setCheckInLocation(request.getLocation());
        attendance.setCheckInNotes(request.getNotes());
        
        // Determine if user is late
        boolean isLate = isCheckInLate(checkInTime);
        attendance.setStatus(isLate ? Attendance.AttendanceStatus.LATE : Attendance.AttendanceStatus.CHECKED_IN);
        
        Attendance savedAttendance = attendanceRepository.save(attendance);
        
        log.info("User {} checked in at {} (Status: {})", username, savedAttendance.getCheckInTime(), savedAttendance.getStatus());
        return savedAttendance;
    }
    
    @Transactional
    public Attendance checkOut(CheckOutRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Find today's check-in record
        Optional<Attendance> todayAttendance = attendanceRepository.findTodayAttendanceForUser(user.getId());
        if (todayAttendance.isEmpty()) {
            throw new RuntimeException("No check-in record found for today");
        }
        
        Attendance attendance = todayAttendance.get();
        if (attendance.getStatus() == Attendance.AttendanceStatus.CHECKED_OUT) {
            throw new RuntimeException("You are already checked out today");
        }
        
        LocalDateTime checkOutTime = LocalDateTime.now();
        attendance.setCheckOutTime(checkOutTime);
        attendance.setCheckOutLocation(request.getLocation());
        attendance.setCheckOutNotes(request.getNotes());
        attendance.setStatus(Attendance.AttendanceStatus.CHECKED_OUT);
        
        // Calculate total hours
        Duration duration = Duration.between(attendance.getCheckInTime(), checkOutTime);
        double totalHours = duration.toMinutes() / 60.0;
        attendance.setTotalHours(totalHours);
        
        Attendance savedAttendance = attendanceRepository.save(attendance);
        
        log.info("User {} checked out at {} (Total hours: {})", username, checkOutTime, totalHours);
        return savedAttendance;
    }
    
    public Optional<Attendance> getTodayAttendance(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return attendanceRepository.findTodayAttendanceForUser(user.getId());
    }
    
    public List<Attendance> getAttendanceForCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        switch (user.getRole()) {
            case SYSTEM_ADMIN:
                return attendanceRepository.findAll();
            case FARM_OWNER:
                // Farm owner can see attendance from ALL their owned farms
                List<Attendance> farmOwnerAttendance = new ArrayList<>();
                
                // Get attendance from all owned farms
                for (Farm ownedFarm : user.getOwnedFarms()) {
                    farmOwnerAttendance.addAll(attendanceRepository.findByFarmId(ownedFarm.getId()));
                }
                
                // Also include attendance from assigned farm (if any)
                if (user.getAssignedFarm() != null) {
                    farmOwnerAttendance.addAll(attendanceRepository.findByFarmId(user.getAssignedFarm().getId()));
                }
                
                return farmOwnerAttendance.stream().distinct().collect(Collectors.toList());
                
            case SUPERVISOR:
                // Supervisor can ONLY see attendance in their specific assigned farm
                if (user.getAssignedFarm() != null) {
                    return attendanceRepository.findByFarmId(user.getAssignedFarm().getId());
                }
                return List.of();
            case WORKER:
                // Worker can ONLY see their own attendance
                return attendanceRepository.findByUserId(user.getId());
            default:
                return List.of();
        }
    }
    
    public List<Attendance> getAttendanceByDateRange(String username, LocalDateTime startDate, LocalDateTime endDate) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        switch (user.getRole()) {
            case SYSTEM_ADMIN:
                // System admin can see all attendance
                return attendanceRepository.findAll().stream()
                        .filter(a -> a.getCheckInTime().isAfter(startDate) && a.getCheckInTime().isBefore(endDate))
                        .toList();
            case FARM_OWNER:
            case SUPERVISOR:
                // Can see attendance in their farm
                if (user.getAssignedFarm() != null) {
                    return attendanceRepository.findByFarmIdAndDateRange(
                        user.getAssignedFarm().getId(), startDate, endDate);
                }
                return List.of();
            case WORKER:
                // Can only see their own attendance
                return attendanceRepository.findByUserIdAndDateRange(user.getId(), startDate, endDate);
            default:
                return List.of();
        }
    }
    
    /**
     * Determines if a check-in time is considered late.
     * Late is defined as checking in after WORK_START_HOUR:WORK_START_MINUTE + LATE_GRACE_PERIOD_MINUTES
     * 
     * @param checkInTime The time the user checked in
     * @return true if the check-in is late, false otherwise
     */
    private boolean isCheckInLate(LocalDateTime checkInTime) {
        // Get the expected start time for today
        LocalDateTime expectedStartTime = checkInTime.toLocalDate()
                .atTime(WORK_START_HOUR, WORK_START_MINUTE);
        
        // Add grace period
        LocalDateTime lateThreshold = expectedStartTime.plusMinutes(LATE_GRACE_PERIOD_MINUTES);
        
        // Check if check-in time is after the late threshold
        boolean isLate = checkInTime.isAfter(lateThreshold);
        
        log.debug("Check-in time: {}, Expected: {}, Late threshold: {}, Is late: {}", 
                checkInTime, expectedStartTime, lateThreshold, isLate);
        
        return isLate;
    }
}