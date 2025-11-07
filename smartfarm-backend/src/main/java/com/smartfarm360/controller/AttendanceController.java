package com.smartfarm360.controller;

import com.smartfarm360.dto.CheckInRequest;
import com.smartfarm360.dto.CheckOutRequest;
import com.smartfarm360.model.Attendance;
import com.smartfarm360.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance Management", description = "Check-in/Check-out and attendance tracking APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AttendanceController {
    
    private final AttendanceService attendanceService;
    
    @PostMapping("/check-in")
    @Operation(summary = "Check in", description = "Check in to work")
    public ResponseEntity<?> checkIn(@RequestBody CheckInRequest request, Authentication authentication) {
        try {
            Attendance attendance = attendanceService.checkIn(request, authentication.getName());
            return ResponseEntity.ok().body("Checked in successfully at " + attendance.getCheckInTime());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/check-out")
    @Operation(summary = "Check out", description = "Check out from work")
    public ResponseEntity<?> checkOut(@RequestBody CheckOutRequest request, Authentication authentication) {
        try {
            Attendance attendance = attendanceService.checkOut(request, authentication.getName());
            return ResponseEntity.ok().body("Checked out successfully. Total hours: " + attendance.getTotalHours());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/today")
    @Operation(summary = "Get today's attendance", description = "Get current user's attendance for today")
    public ResponseEntity<?> getTodayAttendance(Authentication authentication) {
        return attendanceService.getTodayAttendance(authentication.getName())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok().body("No attendance record for today"));
    }
    
    @GetMapping
    @Operation(summary = "Get attendance records", description = "Get attendance records based on user role")
    public ResponseEntity<List<Attendance>> getAttendance(Authentication authentication) {
        List<Attendance> attendance = attendanceService.getAttendanceForCurrentUser(authentication.getName());
        return ResponseEntity.ok(attendance);
    }
    
    @GetMapping("/range")
    @Operation(summary = "Get attendance by date range", description = "Get attendance records within date range")
    public ResponseEntity<List<Attendance>> getAttendanceByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        
        List<Attendance> attendance = attendanceService.getAttendanceByDateRange(
                authentication.getName(), startDate, endDate);
        return ResponseEntity.ok(attendance);
    }
}