package com.smartfarm360.service;

import com.smartfarm360.dto.FarmOwnerApplicationRequest;
import com.smartfarm360.dto.UserRegistrationRequest;
import com.smartfarm360.model.FarmOwnerApplication;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.FarmOwnerApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final FarmOwnerApplicationRepository applicationRepository;
    private final UserService userService;
    private final EmailServiceHTML emailService;

    @Transactional
    public void submitApplication(FarmOwnerApplicationRequest request) {
        // Check if application already exists
        if (applicationRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("An application with this email already exists");
        }

        // Create application entity
        FarmOwnerApplication application = new FarmOwnerApplication();
        application.setFirstName(request.getFirstName());
        application.setLastName(request.getLastName());
        application.setEmail(request.getEmail());
        application.setPhone(request.getPhone());
        application.setFarmName("TBD"); // To be determined - user will create farms after approval
        application.setFarmLocation("TBD"); // To be determined - user will create farms after approval
        application.setFarmSize(null);
        application.setFarmType(request.getFarmType());
        application.setExpectedUsers(request.getExpectedUsers());
        application.setComments(request.getComments());
        application.setStatus(FarmOwnerApplication.ApplicationStatus.PENDING);
        application.setCreatedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());

        FarmOwnerApplication savedApplication = applicationRepository.save(application);

        // Send confirmation email to applicant
        try {
            emailService.sendApplicationConfirmationEmail(
                savedApplication.getEmail(),
                savedApplication.getFirstName() + " " + savedApplication.getLastName(),
                "SmartFarm360 System" // Generic since no specific farm yet
            );
        } catch (Exception e) {
            log.warn("Failed to send confirmation email to applicant: {}", e.getMessage());
        }

        // Notify system admin
        try {
            emailService.sendNewApplicationNotificationToAdmin(
                savedApplication.getFirstName() + " " + savedApplication.getLastName(),
                "Farm Owner Application", // Generic description
                savedApplication.getEmail(),
                savedApplication.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification to admin: {}", e.getMessage());
        }

        log.info("New farm owner application submitted: {}", 
                savedApplication.getEmail());
    }

    public List<FarmOwnerApplication> getPendingApplications() {
        return applicationRepository.findByStatusOrderByCreatedAtDesc(
                FarmOwnerApplication.ApplicationStatus.PENDING);
    }

    public List<FarmOwnerApplication> getAllApplications() {
        return applicationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public void approveApplication(Long applicationId) {
        FarmOwnerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != FarmOwnerApplication.ApplicationStatus.PENDING) {
            throw new RuntimeException("Application is not in pending status");
        }

        // Generate username and password
        String username = generateUsername(application.getFirstName(), application.getLastName());
        String password = generateSecurePassword();

        // Create farm owner user account
        UserRegistrationRequest userRequest = new UserRegistrationRequest();
        userRequest.setUsername(username);
        userRequest.setEmail(application.getEmail());
        userRequest.setFirstName(application.getFirstName());
        userRequest.setLastName(application.getLastName());
        userRequest.setPhoneNumber(application.getPhone());
        userRequest.setRole(User.Role.FARM_OWNER);
        userRequest.setPassword(password);
        userRequest.setMustChangePassword(true); // Force password change on first login

        try {
            User createdUser = userService.registerUser(userRequest);
            
            // Update application status
            application.setStatus(FarmOwnerApplication.ApplicationStatus.APPROVED);
            application.setReviewedAt(LocalDateTime.now());
            application.setCreatedUserId(createdUser.getId());
            application.setUpdatedAt(LocalDateTime.now());
            
            applicationRepository.save(application);

            // Send approval email with credentials
            emailService.sendApplicationApprovalEmail(
                application.getEmail(),
                application.getFirstName() + " " + application.getLastName(),
                "SmartFarm360 System", // Generic since they'll create farms after login
                username,
                password
            );

            log.info("Application approved and user created: {}", 
                    application.getEmail());

        } catch (Exception e) {
            log.error("Failed to create user account for approved application: {}", e.getMessage());
            throw new RuntimeException("Failed to create user account: " + e.getMessage());
        }
    }

    @Transactional
    public void rejectApplication(Long applicationId, String reason) {
        FarmOwnerApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != FarmOwnerApplication.ApplicationStatus.PENDING) {
            throw new RuntimeException("Application is not in pending status");
        }

        // Update application status
        application.setStatus(FarmOwnerApplication.ApplicationStatus.REJECTED);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewNotes(reason);
        application.setUpdatedAt(LocalDateTime.now());
        
        applicationRepository.save(application);

        // Send rejection email
        try {
            emailService.sendApplicationRejectionEmail(
                application.getEmail(),
                application.getFirstName() + " " + application.getLastName(),
                "SmartFarm360 Application", // Generic description
                reason
            );
        } catch (Exception e) {
            log.warn("Failed to send rejection email: {}", e.getMessage());
        }

        log.info("Application rejected: {}", 
                application.getEmail());
    }

    private String generateUsername(String firstName, String lastName) {
        String baseUsername = (firstName.toLowerCase() + "." + lastName.toLowerCase())
                .replaceAll("[^a-z.]", "");
        
        // Add random suffix to ensure uniqueness
        String suffix = UUID.randomUUID().toString().substring(0, 4);
        return baseUsername + "." + suffix;
    }

    private String generateSecurePassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}