package com.smartfarm360.controller;

import com.smartfarm360.model.User;
import com.smartfarm360.repository.FarmRepository;
import com.smartfarm360.repository.UserRepository;
import com.smartfarm360.service.SupervisorAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/supervisor-assignments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Supervisor Assignment Management", description = "Supervisor farm assignment APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SupervisorAssignmentController {
    
    private final SupervisorAssignmentService supervisorAssignmentService;
    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    
    @PostMapping("/assign")
    @Operation(summary = "Assign supervisor to farm", description = "Assign a supervisor to a farm (max 2 farms per supervisor)")
    public ResponseEntity<?> assignSupervisorToFarm(
            @RequestParam Long supervisorId,
            @RequestParam Long farmId,
            Authentication authentication) {
        try {
            log.info("Received request to assign supervisor {} to farm {} from user {}", 
                    supervisorId, farmId, authentication.getName());
            
            User updatedSupervisor = supervisorAssignmentService.assignSupervisorToFarm(
                    supervisorId, farmId, authentication.getName());
            
            log.info("Successfully assigned supervisor {} to farm {}", supervisorId, farmId);
            return ResponseEntity.ok(updatedSupervisor);
        } catch (RuntimeException e) {
            log.error("Failed to assign supervisor {} to farm {}: {}", supervisorId, farmId, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error assigning supervisor {} to farm {}: {}", supervisorId, farmId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Internal server error: " + e.getMessage());
        }
    }
    
    @PostMapping("/remove")
    @Operation(summary = "Remove supervisor from farm", description = "Remove a supervisor from a farm assignment")
    public ResponseEntity<?> removeSupervisorFromFarm(
            @RequestParam Long supervisorId,
            @RequestParam Long farmId,
            Authentication authentication) {
        try {
            User updatedSupervisor = supervisorAssignmentService.removeSupervisorFromFarm(
                    supervisorId, farmId, authentication.getName());
            return ResponseEntity.ok(updatedSupervisor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/reassign")
    @Operation(summary = "Reassign supervisor between farms", description = "Move a supervisor from one farm to another")
    public ResponseEntity<?> reassignSupervisor(
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        try {
            Long supervisorId = request.get("supervisorId");
            Long fromFarmId = request.get("fromFarmId");
            Long toFarmId = request.get("toFarmId");
            
            if (supervisorId == null || fromFarmId == null || toFarmId == null) {
                return ResponseEntity.badRequest().body("supervisorId, fromFarmId, and toFarmId are required");
            }
            
            User updatedSupervisor = supervisorAssignmentService.reassignSupervisor(
                    supervisorId, fromFarmId, toFarmId, authentication.getName());
            return ResponseEntity.ok(updatedSupervisor);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/farm/{farmId}/supervisors")
    @Operation(summary = "Get supervisors for farm", description = "Get all supervisors assigned to a specific farm")
    public ResponseEntity<?> getSupervisorsForFarm(
            @PathVariable Long farmId,
            Authentication authentication) {
        try {
            List<User> supervisors = supervisorAssignmentService.getSupervisorsForFarm(farmId, authentication.getName());
            return ResponseEntity.ok(supervisors);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/test")
    @Operation(summary = "Test endpoint", description = "Test if the supervisor assignment system is working")
    public ResponseEntity<?> testAssignmentSystem(Authentication authentication) {
        try {
            log.info("Testing supervisor assignment system for user: {}", authentication.getName());
            
            // Get current user details
            User currentUser = userRepository.findByUsername(authentication.getName())
                    .orElse(null);
            
            // Test database connectivity
            long userCount = userRepository.count();
            long farmCount = farmRepository.count();
            
            Map<String, Object> testResult = Map.of(
                "status", "OK",
                "userCount", userCount,
                "farmCount", farmCount,
                "currentUser", authentication.getName(),
                "currentUserRole", currentUser != null ? currentUser.getRole().toString() : "Unknown",
                "currentUserId", currentUser != null ? currentUser.getId() : "Unknown",
                "timestamp", java.time.LocalDateTime.now()
            );
            
            return ResponseEntity.ok(testResult);
        } catch (Exception e) {
            log.error("Test failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Test failed: " + e.getMessage());
        }
    }
}