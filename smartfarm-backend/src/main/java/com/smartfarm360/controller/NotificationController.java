package com.smartfarm360.controller;

import com.smartfarm360.dto.NotificationRequest;
import com.smartfarm360.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Email and SMS notification management")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    @Operation(summary = "Send notification", description = "Send email or SMS notification")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISOR')")
    public ResponseEntity<?> sendNotification(@RequestBody NotificationRequest request) {
        try {
            notificationService.sendNotification(request);
            return ResponseEntity.ok().body("Notification sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send notification: " + e.getMessage());
        }
    }

    @PostMapping("/attendance")
    @Operation(summary = "Send attendance notification", description = "Send notification for attendance events")
    public ResponseEntity<?> sendAttendanceNotification(
            @RequestParam Long userId,
            @RequestParam String type,
            @RequestParam String location) {
        try {
            notificationService.sendAttendanceNotification(userId, type, location);
            return ResponseEntity.ok().body("Attendance notification sent");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send attendance notification: " + e.getMessage());
        }
    }

    @PostMapping("/task")
    @Operation(summary = "Send task notification", description = "Send notification for task events")
    public ResponseEntity<?> sendTaskNotification(
            @RequestParam Long taskId,
            @RequestParam String action) {
        try {
            notificationService.sendTaskNotification(taskId, action);
            return ResponseEntity.ok().body("Task notification sent");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send task notification: " + e.getMessage());
        }
    }

    @GetMapping("/config")
    @Operation(summary = "Get notification configuration", description = "Get current notification settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getNotificationConfig() {
        return ResponseEntity.ok(notificationService.getNotificationConfig());
    }

    @PutMapping("/config")
    @Operation(summary = "Update notification configuration", description = "Update notification settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateNotificationConfig(@RequestBody Object config) {
        try {
            notificationService.updateNotificationConfig(config);
            return ResponseEntity.ok().body("Notification configuration updated");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to update configuration: " + e.getMessage());
        }
    }

    @GetMapping("/history")
    @Operation(summary = "Get notification history", description = "Get sent notification history")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPERVISOR')")
    public ResponseEntity<?> getNotificationHistory() {
        return ResponseEntity.ok(notificationService.getNotificationHistory());
    }
}