package com.smartfarm360.controller;

import com.smartfarm360.dto.UserRegistrationRequest;
import com.smartfarm360.dto.UserResponse;
import com.smartfarm360.model.User;
import com.smartfarm360.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Get all users", description = "Get all users in the system (System Admin only)")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserResponse> userResponses = users.stream()
            .map(UserResponse::fromUser)
            .toList();
        return ResponseEntity.ok(userResponses);
    }

    @GetMapping("/for-farm-owner")
    @Operation(summary = "Get users for farm owner", description = "Get users that farm owner can manage")
    public ResponseEntity<?> getUsersForFarmOwner(Authentication authentication) {
        try {
            List<User> users = userService.getUsersForCurrentUser(authentication.getName());
            List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .toList();
            return ResponseEntity.ok(userResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/test")
    @Operation(summary = "Test endpoint", description = "Test if authentication works")
    public ResponseEntity<?> testAuth(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("No authentication");
        }
        return ResponseEntity.ok("Authentication works for: " + authentication.getName());
    }

    @GetMapping("/my-users")
    @Operation(summary = "Get my users", description = "Get users that current user can manage")
    public ResponseEntity<?> getMyUsers(Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body("Authentication required");
            }

            List<User> users = userService.getUsersForCurrentUser(authentication.getName());
            
            // Convert to DTOs to avoid serialization issues
            List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .toList();
            
            return ResponseEntity.ok(userResponses);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping
    @Operation(summary = "Create user", description = "Create a new user")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRegistrationRequest request,
            Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.status(401).body("Authentication required");
            }

            // Create the user
            User createdUser = userService.createUserByRole(request, authentication.getName());

            if (createdUser == null || createdUser.getId() == null) {
                return ResponseEntity.status(500).body("User creation failed - no user returned");
            }

            // Return a clean success response
            String roleText = request.getRole().toString().toLowerCase();
            String capitalizedRole = roleText.substring(0, 1).toUpperCase() + roleText.substring(1);
            
            // Return a simple success message that frontend expects
            return ResponseEntity.ok().body(capitalizedRole + " created successfully! Login credentials have been sent to " + createdUser.getEmail());

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Get user details by ID")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(UserResponse.fromUser(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Update user details")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        try {
            User user = userService.updateUser(id, updatedUser);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user", description = "Delete user (soft delete)")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().body("User deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Toggle user status", description = "Activate/deactivate user")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        try {
            User user = userService.toggleUserStatus(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/farm-owners")
    @Operation(summary = "Get all farm owners", description = "Get list of all farm owners")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllFarmOwners() {
        List<UserResponse> farmOwners = userService.getUsersByRole("FARM_OWNER");
        return ResponseEntity.ok(farmOwners);
    }

    @GetMapping("/supervisors")
    @Operation(summary = "Get all supervisors", description = "Get list of all supervisors")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('FARM_OWNER')")
    public ResponseEntity<List<UserResponse>> getAllSupervisors() {
        List<UserResponse> supervisors = userService.getUsersByRole("SUPERVISOR");
        return ResponseEntity.ok(supervisors);
    }

    @GetMapping("/workers")
    @Operation(summary = "Get all workers", description = "Get list of all workers")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('FARM_OWNER') or hasRole('SUPERVISOR')")
    public ResponseEntity<List<UserResponse>> getAllWorkers() {
        List<UserResponse> workers = userService.getUsersByRole("WORKER");
        return ResponseEntity.ok(workers);
    }

    @GetMapping("/supervisors/assigned")
    @Operation(summary = "Get assigned supervisors", description = "Get supervisors assigned to farms")
    @PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('FARM_OWNER')")
    public ResponseEntity<List<UserResponse>> getAssignedSupervisors() {
        List<UserResponse> assignedSupervisors = userService.getAssignedSupervisors();
        return ResponseEntity.ok(assignedSupervisors);
    }
    
    @GetMapping("/{userId}/stats")
    @Operation(summary = "Get worker statistics", description = "Get performance and attendance statistics for a worker")
    public ResponseEntity<?> getWorkerStats(@PathVariable Long userId, Authentication authentication) {
        try {
            return ResponseEntity.ok(userService.getWorkerStats(userId, authentication.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}