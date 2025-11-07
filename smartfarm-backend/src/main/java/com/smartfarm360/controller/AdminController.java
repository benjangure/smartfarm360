package com.smartfarm360.controller;

import com.smartfarm360.config.SmartFarmConfig;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmartFarmConfig smartFarmConfig;
    
    @PostMapping("/reset-admin-password")
    public ResponseEntity<Map<String, String>> resetAdminPassword() {
        try {
            Optional<User> adminUser = userRepository.findByUsername("sysadmin");
            
            if (adminUser.isPresent()) {
                User admin = adminUser.get();
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail(smartFarmConfig.getAdmin().getEmail());
                admin.setUpdatedAt(LocalDateTime.now());
                userRepository.save(admin);
                
                Map<String, String> response = new HashMap<>();
                response.put("message", "Admin password reset successfully");
                response.put("username", "sysadmin");
                response.put("password", "admin123");
                response.put("email", admin.getEmail());
                
                log.info("Admin password reset for user: {}", admin.getUsername());
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> response = new HashMap<>();
                response.put("error", "Admin user not found");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            log.error("Failed to reset admin password", e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to reset admin password: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/users")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        try {
            var users = userRepository.findAll();
            Map<String, Object> response = new HashMap<>();
            response.put("users", users);
            response.put("count", users.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get users", e);
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Failed to get users: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}