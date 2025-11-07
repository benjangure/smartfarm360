package com.smartfarm360.service;

import com.smartfarm360.dto.NotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@smartfarm360.com}")
    private String fromEmail;

    // In-memory storage for demo (use database in production)
    private final List<Map<String, Object>> notificationHistory = new ArrayList<>();

    public void sendNotification(NotificationRequest request) {
        log.info("Sending notification: {}", request);

        if ("email".equals(request.getType()) || "both".equals(request.getType())) {
            sendEmailNotification(request);
        }

        if ("sms".equals(request.getType()) || "both".equals(request.getType())) {
            sendSmsNotification(request);
        }

        // Store in history
        Map<String, Object> historyEntry = new HashMap<>();
        historyEntry.put("timestamp", LocalDateTime.now());
        historyEntry.put("type", request.getType());
        historyEntry.put("recipients", request.getRecipients());
        historyEntry.put("subject", request.getSubject());
        historyEntry.put("message", request.getMessage());
        historyEntry.put("priority", request.getPriority());
        historyEntry.put("category", request.getCategory());
        historyEntry.put("status", "sent");
        notificationHistory.add(historyEntry);
    }

    private void sendEmailNotification(NotificationRequest request) {
        try {
            for (String recipient : request.getRecipients()) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(recipient);
                message.setSubject(request.getSubject());
                message.setText(request.getMessage());
                
                // For demo, just log the email (uncomment below to actually send)
                log.info("EMAIL SENT TO: {} | SUBJECT: {} | MESSAGE: {}", 
                    recipient, request.getSubject(), request.getMessage());
                
                // mailSender.send(message);
            }
        } catch (Exception e) {
            log.error("Failed to send email notification", e);
            throw new RuntimeException("Failed to send email notification", e);
        }
    }

    private void sendSmsNotification(NotificationRequest request) {
        try {
            for (String recipient : request.getRecipients()) {
                // For demo, just log the SMS (integrate with Twilio/AWS SNS in production)
                log.info("SMS SENT TO: {} | MESSAGE: {}", recipient, request.getMessage());
                
                // TODO: Integrate with SMS provider
                // twilioService.sendSms(recipient, request.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to send SMS notification", e);
            throw new RuntimeException("Failed to send SMS notification", e);
        }
    }

    public void sendAttendanceNotification(Long userId, String type, String location) {
        NotificationRequest request = new NotificationRequest();
        request.setType("both");
        request.setRecipients(List.of("supervisor@smartfarm360.com")); // Get supervisor email from DB
        request.setSubject("Worker " + type + " Notification");
        request.setMessage(String.format("Worker ID %d has %s at %s on %s", 
            userId, type.replace("-", " "), location, LocalDateTime.now()));
        request.setPriority("medium");
        request.setCategory("attendance");
        
        sendNotification(request);
    }

    public void sendTaskNotification(Long taskId, String action) {
        NotificationRequest request = new NotificationRequest();
        request.setType("both");
        request.setRecipients(List.of("worker@smartfarm360.com")); // Get assigned user email from DB
        request.setSubject("Task " + action);
        request.setMessage(String.format("Task #%d has been %s", taskId, action));
        request.setPriority(action.equals("overdue") ? "high" : "medium");
        request.setCategory("task");
        
        sendNotification(request);
    }

    public Map<String, Object> getNotificationConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("emailEnabled", true);
        config.put("smsEnabled", true);
        config.put("emailSettings", Map.of(
            "smtpHost", "smtp.gmail.com",
            "smtpPort", 587,
            "fromEmail", fromEmail
        ));
        config.put("smsSettings", Map.of(
            "provider", "twilio",
            "fromNumber", "+1234567890"
        ));
        return config;
    }

    public void updateNotificationConfig(Object config) {
        log.info("Updating notification configuration: {}", config);
        // TODO: Implement configuration update logic
    }

    public List<Map<String, Object>> getNotificationHistory() {
        return notificationHistory;
    }
}