package com.smartfarm360.dto;

import lombok.Data;
import java.util.List;

@Data
public class NotificationRequest {
    private String type; // email, sms, both
    private List<String> recipients;
    private String subject;
    private String message;
    private String priority; // low, medium, high, urgent
    private String category; // attendance, task, alert, report
}