package com.smartfarm360.service;

import com.smartfarm360.config.SmartFarmConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service("emailServiceHTML")
@RequiredArgsConstructor
@Slf4j
public class EmailServiceHTML {
    
    private final JavaMailSender mailSender;
    private final SmartFarmConfig smartFarmConfig;
    
    private static final String EMAIL_TEMPLATE = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
                .content { padding: 30px; }
                .content h2 { color: #10b981; margin-top: 0; font-size: 22px; }
                .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .info-box strong { color: #059669; }
                .credentials { background: #f9fafb; border: 2px dashed #d1d5db; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
                .credentials p { margin: 10px 0; font-size: 16px; }
                .credentials strong { color: #10b981; font-size: 18px; }
                .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
                .button:hover { background: #059669; }
                .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
                .footer a { color: #10b981; text-decoration: none; }
                .icon { font-size: 48px; margin-bottom: 10px; }
                .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">🌾</div>
                    <h1>SmartFarm360</h1>
                    <p>Modern Farm Management System</p>
                </div>
                <div class="content">
                    %s
                </div>
                <div class="footer">
                    <p><strong>SmartFarm360</strong> - Empowering Modern Agriculture</p>
                    <p>📧 <a href="mailto:support@smartfarm360.com">support@smartfarm360.com</a> | 📞 +254 700 000 000</p>
                    <p style="margin-top: 15px; color: #9ca3af;">This is an automated message, please do not reply directly to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """;
    
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            log.info("📧 Attempting to send HTML email to: {} with subject: {}", to, subject);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            // Use replace instead of String.format to avoid issues with special characters in content
            helper.setText(EMAIL_TEMPLATE.replace("%s", htmlContent), true);
            helper.setFrom("noreply@smartfarm360.com");
            
            mailSender.send(message);
            log.info("✅ HTML email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("❌ Failed to send HTML email to: {} - Error: {}", to, e.getMessage(), e);
        }
    }
    
    @Async
    public void sendCredentialsEmail(String to, String fullName, String username, String password) {
        String content = String.format("""
            <h2>Welcome to SmartFarm360! 🎉</h2>
            <p>Dear <strong>%s</strong>,</p>
            <p>Your account has been created successfully. You can now access the SmartFarm360 platform with your credentials below:</p>
            
            <div class="credentials">
                <p><strong>Username:</strong> <span style="font-family: monospace; font-size: 18px;">%s</span></p>
                <p><strong>Password:</strong> <span style="font-family: monospace; font-size: 18px;">%s</span></p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <p style="margin: 10px 0 0 0;">Please change your password after your first login for security purposes.</p>
            </div>
            
            <p style="text-align: center;">
                <a href="http://localhost:4200/login" class="button">Login to SmartFarm360</a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br><strong>The SmartFarm360 Team</strong></p>
            """, fullName, username, password);
        
        sendHtmlEmail(to, "SmartFarm360 - Your Account Credentials", content);
    }
    
    @Async
    public void sendTaskAssignmentEmail(String to, String workerName, String taskTitle, String dueDate) {
        String content = String.format("""
            <h2>New Task Assigned 📋</h2>
            <p>Dear <strong>%s</strong>,</p>
            <p>A new task has been assigned to you. Please review the details below:</p>
            
            <div class="info-box">
                <p><strong>Task:</strong> %s</p>
                <p><strong>Due Date:</strong> %s</p>
            </div>
            
            <p style="text-align: center;">
                <a href="http://localhost:4200/dashboard/my-tasks" class="button">View Task Details</a>
            </p>
            
            <p>Please login to SmartFarm360 to view complete task details and start working on it.</p>
            <p>Best regards,<br><strong>The SmartFarm360 Team</strong></p>
            """, workerName, taskTitle, dueDate);
        
        sendHtmlEmail(to, "SmartFarm360 - New Task Assigned", content);
    }
    
    @Async
    public void sendApplicationConfirmationEmail(String to, String applicantName, String farmName) {
        String content = String.format("""
            <h2>Application Received ✅</h2>
            <p>Dear <strong>%s</strong>,</p>
            <p>Thank you for your interest in SmartFarm360!</p>
            
            <div class="success">
                <p style="margin: 0;"><strong>✓ Your application has been received successfully</strong></p>
            </div>
            
            <div class="info-box">
                <p><strong>Farm Name:</strong> %s</p>
                <p><strong>Application Date:</strong> %s</p>
            </div>
            
            <p>Our team will review your application and get back to you within <strong>24 hours</strong>.</p>
            <p>You will receive an email notification once your application has been processed.</p>
            
            <p>If you have any questions, please contact us at <a href="mailto:admin@smartfarm360.com">admin@smartfarm360.com</a></p>
            
            <p>Best regards,<br><strong>The SmartFarm360 Team</strong></p>
            """, applicantName, farmName, LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
        
        sendHtmlEmail(to, "SmartFarm360 - Application Received", content);
    }
    
    @Async
    public void sendApplicationApprovalEmail(String to, String applicantName, String farmName, String username, String password) {
        String content = String.format("""
            <h2>Application Approved! 🎉</h2>
            <p>Dear <strong>%s</strong>,</p>
            <p><strong>Congratulations!</strong> Your application for SmartFarm360 has been approved.</p>
            
            <div class="success">
                <p style="margin: 0;"><strong>✓ Your account is now active</strong></p>
            </div>
            
            <div class="info-box">
                <p><strong>Farm:</strong> %s</p>
            </div>
            
            <p>Your account has been created with the following credentials:</p>
            
            <div class="credentials">
                <p><strong>Username:</strong> <span style="font-family: monospace; font-size: 18px;">%s</span></p>
                <p><strong>Password:</strong> <span style="font-family: monospace; font-size: 18px;">%s</span></p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Reminder:</strong>
                <p style="margin: 10px 0 0 0;">Please change your password after your first login.</p>
            </div>
            
            <p style="text-align: center;">
                <a href="http://localhost:4200/login" class="button">Login to SmartFarm360</a>
            </p>
            
            <p>Welcome to SmartFarm360! We're excited to have you on board.</p>
            <p>Best regards,<br><strong>The SmartFarm360 Team</strong></p>
            """, applicantName, farmName, username, password);
        
        sendHtmlEmail(to, "SmartFarm360 - Application Approved - Welcome!", content);
    }
    
    @Async
    public void sendTaskCompletionNotificationEmail(String to, String supervisorName, String taskTitle, String workerName) {
        String content = String.format("""
            <h2>Task Completed ✅</h2>
            <p>Dear <strong>%s</strong>,</p>
            <p>A task has been marked as completed:</p>
            
            <div class="info-box">
                <p><strong>Task:</strong> %s</p>
                <p><strong>Completed by:</strong> %s</p>
                <p><strong>Completion Time:</strong> %s</p>
            </div>
            
            <p style="text-align: center;">
                <a href="http://localhost:4200/dashboard/tasks" class="button">Review Task Details</a>
            </p>
            
            <p>Please login to SmartFarm360 to review the task details and any completion notes.</p>
            <p>Best regards,<br><strong>The SmartFarm360 Team</strong></p>
            """, supervisorName, taskTitle, workerName, 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a")));
        
        sendHtmlEmail(to, "SmartFarm360 - Task Completed", content);
    }
    
    @Async
    public void sendPasswordChangeNotificationEmail(String to, String fullName) {
        String content = String.format("""
            <h2>Password Changed Successfully 🔒</h2>
            <p>Dear <strong>%s</strong>,</p>
            <p>Your SmartFarm360 account password has been changed successfully.</p>
            
            <div class="success">
                <p style="margin: 0;"><strong>✓ Password updated on %s</strong></p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Didn't make this change?</strong>
                <p style="margin: 10px 0 0 0;">If you did not make this change, please contact our support team immediately.</p>
            </div>
            
            <p><strong>Security Tips:</strong></p>
            <ul>
                <li>Never share your password with anyone</li>
                <li>Use a strong, unique password</li>
                <li>Log out when using shared computers</li>
                <li>Enable two-factor authentication if available</li>
            </ul>
            
            <p>Best regards,<br><strong>The SmartFarm360 Team</strong></p>
            """, fullName, LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a")));
        
        sendHtmlEmail(to, "SmartFarm360 - Password Changed Successfully", content);
    }
    
    @Async
    public void sendNewApplicationNotificationToAdmin(String applicantName, String farmName, String email, Long applicationId) {
        String content = String.format("""
            <h2>New Application Received 📝</h2>
            <p>A new farm owner application has been submitted and requires your review:</p>
            
            <div class="info-box">
                <p><strong>Applicant:</strong> %s</p>
                <p><strong>Farm Name:</strong> %s</p>
                <p><strong>Email:</strong> %s</p>
                <p><strong>Application ID:</strong> #%d</p>
                <p><strong>Submitted:</strong> %s</p>
            </div>
            
            <p style="text-align: center;">
                <a href="http://localhost:4200/dashboard/applications" class="button">Review Application</a>
            </p>
            
            <p>Please login to the SmartFarm360 Admin Panel to approve or reject this application.</p>
            <p>Best regards,<br><strong>SmartFarm360 System</strong></p>
            """, applicantName, farmName, email, applicationId,
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a")));
        
        sendHtmlEmail(smartFarmConfig.getAdmin().getEmail(), "SmartFarm360 - New Application Received", content);
    }
    
    @Async
    public void sendApplicationRejectionEmail(String to, String applicantName, String farmName, String reason) {
        String content = String.format("""
            <h2>Application Status Update</h2>
            <p>Dear <strong>%s</strong>,</p>
            <p>Thank you for your interest in SmartFarm360.</p>
            
            <div class="warning">
                <p style="margin: 0;">After careful review, we regret to inform you that your application for farm '<strong>%s</strong>' cannot be approved at this time.</p>
            </div>
            
            <div class="info-box">
                <p><strong>Reason:</strong> %s</p>
            </div>
            
            <p>If you have any questions or would like to discuss this decision, please feel free to contact us at <a href="mailto:admin@smartfarm360.com">admin@smartfarm360.com</a></p>
            
            <p>Thank you for considering SmartFarm360.</p>
            <p>Best regards,<br><strong>The SmartFarm360 Team</strong></p>
            """, applicantName, farmName, reason);
        
        sendHtmlEmail(to, "SmartFarm360 - Application Status Update", content);
    }
}
