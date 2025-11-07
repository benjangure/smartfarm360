package com.smartfarm360.controller;

import com.smartfarm360.config.SmartFarmConfig;
import com.smartfarm360.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
public class TestController {
    
    private final EmailService emailService;
    private final SmartFarmConfig smartFarmConfig;
    
    @PostMapping("/email")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> testEmail() {
        try {
            // Test sending a new application notification to admin
            emailService.sendNewApplicationNotificationToAdmin(
                "Test Applicant", 
                "Test Farm", 
                "test@example.com", 
                999L
            );
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Test email sent successfully to: " + smartFarmConfig.getAdmin().getEmail());
            response.put("adminEmail", smartFarmConfig.getAdmin().getEmail());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to send test email", e);
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to send test email: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/config")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Map<String, String>> getConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("adminEmail", smartFarmConfig.getAdmin().getEmail());
        return ResponseEntity.ok(config);
    }
}