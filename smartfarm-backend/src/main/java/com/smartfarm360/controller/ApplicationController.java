package com.smartfarm360.controller;

import com.smartfarm360.dto.FarmOwnerApplicationRequest;
import com.smartfarm360.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Farm owner application management")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping("/test")
    @Operation(summary = "Test endpoint", description = "Test if the application system is working")
    public ResponseEntity<?> testEndpoint() {
        try {
            long count = applicationService.getAllApplications().size();
            return ResponseEntity.ok().body(Map.of(
                "status", "success",
                "message", "Application system is working",
                "totalApplications", count
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Application system error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/debug-users")
    @Operation(summary = "Debug users", description = "Check what users exist in database")
    public ResponseEntity<?> debugUsers() {
        try {
            // This is a debug endpoint to see what users exist
            return ResponseEntity.ok().body("Debug endpoint - check backend logs for user information");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Debug error: " + e.getMessage());
        }
    }

    @PostMapping("/submit")
    @Operation(summary = "Submit farm owner application", description = "Submit application to use the system")
    public ResponseEntity<?> submitApplication(@RequestBody @jakarta.validation.Valid FarmOwnerApplicationRequest request) {
        try {
            // Log the incoming request for debugging
            System.out.println("Received application request: " + request);
            
            // Validate required fields manually
            if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("First name is required");
            }
            if (request.getLastName() == null || request.getLastName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Last name is required");
            }
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email is required");
            }
            if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Phone is required");
            }
            
            applicationService.submitApplication(request);
            
            // Always return success if we reach here - email failures are logged but don't fail the request
            return ResponseEntity.ok().body(Map.of(
                "message", "Application submitted successfully. You will receive an email confirmation shortly.",
                "status", "success",
                "timestamp", LocalDateTime.now()
            ));
            
        } catch (RuntimeException e) {
            // Handle business logic errors (like duplicate applications)
            System.err.println("Application submission business error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage(),
                "status", "error",
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            // Log the full error for debugging
            System.err.println("Application submission system error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "message", "System error occurred. Please try again or contact support.",
                "status", "error",
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending applications", description = "Get all pending farm owner applications (Admin only)")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> getPendingApplications() {
        return ResponseEntity.ok(applicationService.getPendingApplications());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve application", description = "Approve farm owner application and create account")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> approveApplication(@PathVariable Long id) {
        try {
            applicationService.approveApplication(id);
            return ResponseEntity.ok().body(Map.of(
                "message", "Application approved and account created successfully",
                "status", "success",
                "timestamp", LocalDateTime.now()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage(),
                "status", "error",
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            System.err.println("Application approval system error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "message", "System error occurred during approval. Please check if the operation completed successfully.",
                "status", "error",
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject application", description = "Reject farm owner application")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> rejectApplication(@PathVariable Long id, @RequestBody String reason) {
        try {
            applicationService.rejectApplication(id, reason);
            return ResponseEntity.ok().body(Map.of(
                "message", "Application rejected successfully",
                "status", "success",
                "timestamp", LocalDateTime.now()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage(),
                "status", "error",
                "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            System.err.println("Application rejection system error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "message", "System error occurred during rejection. Please check if the operation completed successfully.",
                "status", "error",
                "timestamp", LocalDateTime.now()
            ));
        }
    }

    @GetMapping("/all")
    @Operation(summary = "Get all applications", description = "Get all applications with status (Admin only)")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> getAllApplications() {
        return ResponseEntity.ok(applicationService.getAllApplications());
    }
}