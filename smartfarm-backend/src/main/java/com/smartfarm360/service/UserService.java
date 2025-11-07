package com.smartfarm360.service;

import com.smartfarm360.dto.UserRegistrationRequest;
import com.smartfarm360.model.Farm;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.FarmRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailServiceHTML emailServiceHTML;
    private final WorkerStatsService workerStatsService;

    @Transactional
    public User registerUser(UserRegistrationRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(request.getRole());

        // Assign farm if provided
        if (request.getFarmId() != null) {
            Farm farm = farmRepository.findById(request.getFarmId())
                    .orElseThrow(() -> new RuntimeException("Farm not found"));
            user.setAssignedFarm(farm);
        }

        user.setIsActive(true);
        user.setMustChangePassword(request.getMustChangePassword() != null ? request.getMustChangePassword() : false);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // DO NOT send welcome email here - emails are handled by the calling service
        // (ApplicationService for farm owners, UserService.createUserByRole for supervisors/workers)

        log.info("User registered successfully: {}", savedUser.getUsername());
        return savedUser;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getUsersByRole(User.Role role) {
        return userRepository.findByRole(role);
    }

    public List<User> getUsersByFarm(Long farmId) {
        return userRepository.findByAssignedFarmId(farmId);
    }

    @Transactional
    public User updateUser(Long id, User updatedUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(updatedUser.getFirstName());
        user.setLastName(updatedUser.getLastName());
        user.setEmail(updatedUser.getEmail());
        user.setPhoneNumber(updatedUser.getPhoneNumber());

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String username, String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false); // Clear the flag after password change
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        log.info("Password changed successfully for user: {}", username);

        // Send notification email using HTML email service
        try {
            emailServiceHTML.sendPasswordChangeNotificationEmail(
                    user.getEmail(),
                    user.getFirstName() + " " + user.getLastName());
        } catch (Exception e) {
            log.warn("Failed to send password change notification to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    public List<User> getUsersForCurrentUser(String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        switch (currentUser.getRole()) {
            case SYSTEM_ADMIN:
                // System admin can see all users
                return userRepository.findAll();
            case FARM_OWNER:
                // Farm owner can see supervisors and workers in ALL their owned farms
                List<User> farmOwnerUsers = new ArrayList<>();

                // Get users from all owned farms
                for (Farm ownedFarm : currentUser.getOwnedFarms()) {
                    farmOwnerUsers.addAll(userRepository.findByAssignedFarmIdAndRoleIn(
                            ownedFarm.getId(),
                            List.of(User.Role.SUPERVISOR, User.Role.WORKER)));
                }

                // Also include users from assigned farm (if any)
                if (currentUser.getAssignedFarm() != null) {
                    farmOwnerUsers.addAll(userRepository.findByAssignedFarmIdAndRoleIn(
                            currentUser.getAssignedFarm().getId(),
                            List.of(User.Role.SUPERVISOR, User.Role.WORKER)));
                }

                // Remove duplicates and fetch supervised farms for supervisors
                List<User> distinctUsers = farmOwnerUsers.stream().distinct().collect(Collectors.toList());

                // For supervisors, fetch their supervised farms
                List<Long> supervisorIds = distinctUsers.stream()
                        .filter(u -> u.getRole() == User.Role.SUPERVISOR)
                        .map(User::getId)
                        .collect(Collectors.toList());

                if (!supervisorIds.isEmpty()) {
                    List<User> supervisorsWithFarms = userRepository.findUsersWithSupervisedFarms(supervisorIds);
                    // Create a map for quick lookup
                    Map<Long, User> supervisorMap = supervisorsWithFarms.stream()
                            .collect(Collectors.toMap(User::getId, user -> user));

                    // Replace supervisors in the list with the ones that have supervised farms
                    // loaded
                    for (int i = 0; i < distinctUsers.size(); i++) {
                        User user = distinctUsers.get(i);
                        if (user.getRole() == User.Role.SUPERVISOR && supervisorMap.containsKey(user.getId())) {
                            distinctUsers.set(i, supervisorMap.get(user.getId()));
                        }
                    }
                }

                return distinctUsers;

            case SUPERVISOR:
                // Supervisor can ONLY see workers in their specific assigned farm
                // Use a direct query to get the supervisor's farm ID and find workers
                List<User> workers = userRepository.findWorkersBySupervisorUsername(currentUser.getUsername());
                return workers;
            default:
                // Workers cannot see other users
                return List.of();
        }
    }

    @Transactional
    public User createUserByRole(UserRegistrationRequest request, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Creator user not found"));

        // Validate role permissions
        if (creator.getRole() == User.Role.FARM_OWNER &&
                (request.getRole() != User.Role.SUPERVISOR && request.getRole() != User.Role.WORKER)) {
            throw new RuntimeException("Farm owners can only create supervisors and workers");
        }
        if (creator.getRole() == User.Role.SUPERVISOR && request.getRole() != User.Role.WORKER) {
            throw new RuntimeException("Supervisors can only create workers");
        }

        // Set farm assignment based on creator's role and farm
        if (request.getRole() == User.Role.SUPERVISOR || request.getRole() == User.Role.WORKER) {
            if (creator.getRole() == User.Role.FARM_OWNER) {
                // Farm owner must specify which farm to assign to
                if (request.getFarmId() == null) {
                    // Default to first owned farm if not specified
                    if (!creator.getOwnedFarms().isEmpty()) {
                        request.setFarmId(creator.getOwnedFarms().get(0).getId());
                    } else if (creator.getAssignedFarm() != null) {
                        request.setFarmId(creator.getAssignedFarm().getId());
                    } else {
                        throw new RuntimeException("No farm available for assignment");
                    }
                }

                // Validate that the farm exists and farm owner has access to it
                Farm targetFarm = farmRepository.findById(request.getFarmId())
                        .orElseThrow(() -> new RuntimeException("Farm not found"));

                // Check if farm has an owner and if the current user owns this farm
                if (targetFarm.getOwner() == null) {
                    throw new RuntimeException("Farm has no owner assigned");
                }

                if (!targetFarm.getOwner().getId().equals(creator.getId())) {
                    throw new RuntimeException("You don't have permission to assign users to this farm");
                }

            } else if (creator.getRole() == User.Role.SUPERVISOR) {
                // Supervisor can only assign to their own farm
                // Use a query to get the supervisor's farm ID safely
                Long supervisorFarmId = userRepository.findFarmIdByUsername(creator.getUsername());
                if (supervisorFarmId == null) {
                    throw new RuntimeException("Supervisor has no assigned farm");
                }
                request.setFarmId(supervisorFarmId);
            }
        }

        // Username and password are already provided by the frontend
        // Just ensure mustChangePassword is set
        if (request.getMustChangePassword() == null) {
            request.setMustChangePassword(true); // New users must change password
        }

        User newUser = registerUser(request);

        // Send credentials email using HTML email service
        try {
            emailServiceHTML.sendCredentialsEmail(
                    newUser.getEmail(),
                    newUser.getFirstName() + " " + newUser.getLastName(),
                    request.getUsername(),
                    request.getPassword());
        } catch (Exception e) {
            log.warn("Failed to send credentials email to {}: {}", newUser.getEmail(), e.getMessage());
        }

        log.info("User {} created by {} and assigned to farm {}",
                newUser.getUsername(), creatorUsername, request.getFarmId());

        return newUser;
    }

    private void validateRoleCreationPermission(User.Role creatorRole, User.Role targetRole) {
        switch (creatorRole) {
            case SYSTEM_ADMIN:
                // System admin can create any role
                break;
            case FARM_OWNER:
                if (targetRole != User.Role.SUPERVISOR) {
                    throw new RuntimeException("Farm owners can only create supervisors");
                }
                break;
            case SUPERVISOR:
                if (targetRole != User.Role.WORKER) {
                    throw new RuntimeException("Supervisors can only create workers");
                }
                break;
            default:
                throw new RuntimeException("You don't have permission to create users");
        }
    }

    @Transactional
    public User toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsActive(!user.getIsActive());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    private String generateUsername(String firstName, String lastName) {
        String baseUsername = (firstName.toLowerCase() + "." + lastName.toLowerCase())
                .replaceAll("[^a-z.]", "");

        // Add random suffix to ensure uniqueness
        String suffix = java.util.UUID.randomUUID().toString().substring(0, 4);
        return baseUsername + "." + suffix;
    }

    private String generateSecurePassword() {
        return java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();

        for (int i = 0; i < 8; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }

        return password.toString();
    }

    public List<com.smartfarm360.dto.UserResponse> getUsersByRole(String roleName) {
        User.Role role = User.Role.valueOf(roleName);
        List<User> users = userRepository.findByRole(role);
        return users.stream()
                .map(com.smartfarm360.dto.UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    public List<com.smartfarm360.dto.UserResponse> getAssignedSupervisors() {
        List<User> supervisors = userRepository.findByRoleAndAssignedFarmIsNotNull(User.Role.SUPERVISOR);
        return supervisors.stream()
                .map(com.smartfarm360.dto.UserResponse::fromUser)
                .collect(Collectors.toList());
    }
    
    public com.smartfarm360.dto.WorkerStatsResponse getWorkerStats(Long workerId, String requesterUsername) {
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new RuntimeException("Requester not found"));
        
        User worker = userRepository.findById(workerId)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
        
        // Validate permission
        if (requester.getRole() == User.Role.SUPERVISOR) {
            if (worker.getAssignedFarm() == null || requester.getAssignedFarm() == null ||
                !worker.getAssignedFarm().getId().equals(requester.getAssignedFarm().getId())) {
                throw new RuntimeException("You don't have permission to view this worker's stats");
            }
        } else if (requester.getRole() == User.Role.FARM_OWNER) {
            boolean hasAccess = requester.getOwnedFarms().stream()
                    .anyMatch(farm -> worker.getAssignedFarm() != null && 
                             farm.getId().equals(worker.getAssignedFarm().getId()));
            if (!hasAccess) {
                throw new RuntimeException("You don't have permission to view this worker's stats");
            }
        } else if (requester.getRole() != User.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("You don't have permission to view worker stats");
        }
        
        return workerStatsService.getWorkerStats(workerId);
    }
}