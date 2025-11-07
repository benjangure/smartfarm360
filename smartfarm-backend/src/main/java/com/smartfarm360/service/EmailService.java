package com.smartfarm360.service;

import com.smartfarm360.config.SmartFarmConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final SmartFarmConfig smartFarmConfig;
    
    @Async
    public void sendWelcomeEmail(String to, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Welcome!");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Welcome to SmartFarm360! Your account has been created successfully.\n\n" +
                "You can now login to the system and start managing your farm operations.\n\n" +
                "If you have any questions, please don't hesitate to contact our support team.\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                fullName
            ));
            
            mailSender.send(message);
            log.info("Welcome email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", to, e);
        }
    }

    @Async
    public void sendCredentialsEmail(String to, String fullName, String username, String password) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Your Account Credentials");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Welcome to SmartFarm360! Your account has been created successfully.\n\n" +
                "Your login credentials are:\n" +
                "Username: %s\n" +
                "Password: %s\n\n" +
                "Please login to the system and change your password for security.\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                fullName, username, password
            ));
            
            mailSender.send(message);
            log.info("Credentials email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send credentials email to: {}", to, e);
        }
    }
    
    @Async
    public void sendTaskAssignmentEmail(String to, String workerName, String taskTitle, String dueDate) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - New Task Assigned");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "A new task has been assigned to you:\n\n" +
                "Task: %s\n" +
                "Due Date: %s\n\n" +
                "Please login to SmartFarm360 to view the complete task details.\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                workerName, taskTitle, dueDate
            ));
            
            mailSender.send(message);
            log.info("Task assignment email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send task assignment email to: {}", to, e);
        }
    }
    
    @Async
    public void sendReportEmail(String to, String reportType, String reportUrl) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Report Generated");
            message.setText(String.format(
                "Dear User,\n\n" +
                "Your %s report has been generated successfully.\n\n" +
                "You can download it from: %s\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                reportType, reportUrl
            ));
            
            mailSender.send(message);
            log.info("Report email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send report email to: {}", to, e);
        }
    }

    @Async
    public void sendApplicationConfirmationEmail(String to, String applicantName, String farmName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Application Received");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Thank you for your interest in SmartFarm360!\n\n" +
                "We have received your application for farm: %s\n\n" +
                "Our team will review your application and get back to you within 24 hours.\n" +
                "You will receive an email notification once your application has been processed.\n\n" +
                "If you have any questions, please don't hesitate to contact us at admin@smartfarm360.com\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                applicantName, farmName
            ));
            
            mailSender.send(message);
            log.info("Application confirmation email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send application confirmation email to: {}", to, e);
        }
    }

    @Async
    public void sendNewApplicationNotificationToAdmin(String applicantName, String farmName, String email, Long applicationId) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(smartFarmConfig.getAdmin().getEmail());
            message.setSubject("SmartFarm360 - New Application Received");
            message.setText(String.format(
                "A new farm owner application has been submitted:\n\n" +
                "Applicant: %s\n" +
                "Farm Name: %s\n" +
                "Email: %s\n" +
                "Application ID: %d\n\n" +
                "Please review and process this application in the admin dashboard.\n\n" +
                "Login to SmartFarm360 Admin Panel to approve or reject this application.",
                applicantName, farmName, email, applicationId
            ));
            
            mailSender.send(message);
            log.info("New application notification sent to admin: {} for application ID: {}", 
                smartFarmConfig.getAdmin().getEmail(), applicationId);
            
        } catch (Exception e) {
            log.error("Failed to send application notification to admin for ID: {}", applicationId, e);
        }
    }

    @Async
    public void sendApplicationApprovalEmail(String to, String applicantName, String farmName, String username, String password) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Application Approved - Welcome!");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Congratulations! Your application for SmartFarm360 has been approved.\n\n" +
                "Farm: %s\n\n" +
                "Your account has been created with the following credentials:\n" +
                "Username: %s\n" +
                "Password: %s\n\n" +
                "You can now login to SmartFarm360 and start managing your farm operations.\n" +
                "We recommend changing your password after your first login for security.\n\n" +
                "Welcome to SmartFarm360!\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                applicantName, farmName, username, password
            ));
            
            mailSender.send(message);
            log.info("Application approval email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send application approval email to: {}", to, e);
        }
    }

    @Async
    public void sendApplicationRejectionEmail(String to, String applicantName, String farmName, String reason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Application Status Update");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Thank you for your interest in SmartFarm360.\n\n" +
                "After careful review, we regret to inform you that your application for farm '%s' cannot be approved at this time.\n\n" +
                "Reason: %s\n\n" +
                "If you have any questions or would like to discuss this decision, please feel free to contact us at admin@smartfarm360.com\n\n" +
                "Thank you for considering SmartFarm360.\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                applicantName, farmName, reason
            ));
            
            mailSender.send(message);
            log.info("Application rejection email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send application rejection email to: {}", to, e);
        }
    }

    @Async
    public void sendPasswordChangeNotificationEmail(String to, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Password Changed Successfully");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "Your SmartFarm360 account password has been changed successfully.\n\n" +
                "If you did not make this change, please contact our support team immediately at ngurebenjamin5@gmail.com\n\n" +
                "For your security:\n" +
                "- Never share your password with anyone\n" +
                "- Use a strong, unique password\n" +
                "- Log out when using shared computers\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                fullName
            ));
            
            mailSender.send(message);
            log.info("Password change notification email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send password change notification email to: {}", to, e);
        }
    }

    @Async
    public void sendTaskCompletionNotificationEmail(String to, String supervisorName, String taskTitle, String workerName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("SmartFarm360 - Task Completed");
            message.setText(String.format(
                "Dear %s,\n\n" +
                "A task has been completed:\n\n" +
                "Task: %s\n" +
                "Completed by: %s\n" +
                "Completion time: %s\n\n" +
                "Please login to SmartFarm360 to review the task details and any completion notes.\n\n" +
                "Best regards,\n" +
                "SmartFarm360 Team",
                supervisorName, taskTitle, workerName, LocalDateTime.now().toString()
            ));
            
            mailSender.send(message);
            log.info("Task completion notification email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send task completion notification email to: {}", to, e);
        }
    }
}
