package com.smartfarm360.controller;

import com.smartfarm360.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TestEmailController {
    
    private final EmailService emailService;
    
    @PostMapping("/send-test-email")
    public ResponseEntity<?> sendTestEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email address is required"
                ));
            }
            
            log.info("Sending test email to: {}", email);
            emailService.sendWelcomeEmail(email, "Test User");
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test email sent! Check your inbox and spam folder."
            ));
        } catch (Exception e) {
            log.error("Error sending test email", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to send email: " + e.getMessage()
            ));
        }
    }
}
