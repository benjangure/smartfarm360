package com.smartfarm360.service;

import com.smartfarm360.model.Farm;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.FarmRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupervisorAssignmentService {
    
    private final UserRepository userRepository;
    private final FarmRepository farmRepository;
    
    @Transactional
    public User assignSupervisorToFarm(Long supervisorId, Long farmId, String requestingUsername) {
        log.info("Attempting to assign supervisor {} to farm {} by user {}", supervisorId, farmId, requestingUsername);
        
        try {
            User requestingUser = userRepository.findByUsername(requestingUsername)
                    .orElseThrow(() -> new RuntimeException("Requesting user not found: " + requestingUsername));
            log.info("Found requesting user: {} with role: {}", requestingUser.getUsername(), requestingUser.getRole());
            
            User supervisor = userRepository.findById(supervisorId)
                    .orElseThrow(() -> new RuntimeException("Supervisor not found with ID: " + supervisorId));
            log.info("Found supervisor: {} with role: {}", supervisor.getUsername(), supervisor.getRole());
            
            Farm farm = farmRepository.findByIdWithOwner(farmId);
            if (farm == null) {
                throw new RuntimeException("Farm not found with ID: " + farmId);
            }
            log.info("Found farm: {} owned by: {}", farm.getName(), farm.getOwner().getUsername());
            
            // Validate permissions
            if (!canManageSupervisorAssignment(requestingUser, supervisor, farm)) {
                throw new RuntimeException("You don't have permission to assign this supervisor to this farm");
            }
            log.info("Permission check passed");
            
            // Validate supervisor role
            if (supervisor.getRole() != User.Role.SUPERVISOR) {
                throw new RuntimeException("User is not a supervisor, current role: " + supervisor.getRole());
            }
            log.info("Role validation passed");
            
            // Initialize supervisedFarms list if null
            if (supervisor.getSupervisedFarms() == null) {
                supervisor.setSupervisedFarms(new ArrayList<>());
                log.info("Initialized empty supervisedFarms list");
            }
            
            // Check if supervisor already has maximum assignments (2 farms)
            if (supervisor.getSupervisedFarms().size() >= 2) {
                throw new RuntimeException("Supervisor can only be assigned to a maximum of 2 farms. Current assignments: " + supervisor.getSupervisedFarms().size());
            }
            log.info("Current supervised farms count: {}", supervisor.getSupervisedFarms().size());
            
            // Check if already assigned to this farm
            boolean alreadyAssigned = supervisor.getSupervisedFarms().stream()
                    .anyMatch(f -> f.getId().equals(farmId));
            if (alreadyAssigned) {
                throw new RuntimeException("Supervisor is already assigned to this farm");
            }
            log.info("Assignment uniqueness check passed");
            
            // Add farm to supervisor's assignments
            supervisor.getSupervisedFarms().add(farm);
            log.info("Added farm to supervisor's supervised farms list");
            
            // If this is the first assignment, also set as primary assigned farm
            if (supervisor.getAssignedFarm() == null) {
                supervisor.setAssignedFarm(farm);
                log.info("Set farm as primary assigned farm");
            }
            
            User savedSupervisor = userRepository.save(supervisor);
            log.info("Successfully saved supervisor with {} supervised farms", savedSupervisor.getSupervisedFarms().size());
            
            log.info("Supervisor {} assigned to farm {} by {}", 
                    supervisor.getUsername(), farm.getName(), requestingUsername);
            
            return savedSupervisor;
            
        } catch (Exception e) {
            log.error("Error assigning supervisor {} to farm {}: {}", supervisorId, farmId, e.getMessage(), e);
            throw e;
        }
    }
    
    @Transactional
    public User removeSupervisorFromFarm(Long supervisorId, Long farmId, String requestingUsername) {
        User requestingUser = userRepository.findByUsername(requestingUsername)
                .orElseThrow(() -> new RuntimeException("Requesting user not found"));
        
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found"));
        
        Farm farm = farmRepository.findByIdWithOwner(farmId);
        if (farm == null) {
            throw new RuntimeException("Farm not found");
        }
        
        // Validate permissions
        if (!canManageSupervisorAssignment(requestingUser, supervisor, farm)) {
            throw new RuntimeException("You don't have permission to remove this supervisor from this farm");
        }
        
        // Remove farm from supervisor's assignments
        supervisor.getSupervisedFarms().remove(farm);
        
        // If removing the primary assigned farm, set another one as primary (if available)
        if (supervisor.getAssignedFarm() != null && supervisor.getAssignedFarm().getId().equals(farmId)) {
            if (!supervisor.getSupervisedFarms().isEmpty()) {
                supervisor.setAssignedFarm(supervisor.getSupervisedFarms().get(0));
            } else {
                supervisor.setAssignedFarm(null);
            }
        }
        
        User savedSupervisor = userRepository.save(supervisor);
        log.info("Supervisor {} removed from farm {} by {}", 
                supervisor.getUsername(), farm.getName(), requestingUsername);
        
        return savedSupervisor;
    }
    
    @Transactional
    public User reassignSupervisor(Long supervisorId, Long fromFarmId, Long toFarmId, String requestingUsername) {
        User requestingUser = userRepository.findByUsername(requestingUsername)
                .orElseThrow(() -> new RuntimeException("Requesting user not found"));
        
        User supervisor = userRepository.findById(supervisorId)
                .orElseThrow(() -> new RuntimeException("Supervisor not found"));
        
        Farm fromFarm = farmRepository.findByIdWithOwner(fromFarmId);
        if (fromFarm == null) {
            throw new RuntimeException("Source farm not found");
        }
        
        Farm toFarm = farmRepository.findByIdWithOwner(toFarmId);
        if (toFarm == null) {
            throw new RuntimeException("Target farm not found");
        }
        
        // Validate permissions for both farms
        if (!canManageSupervisorAssignment(requestingUser, supervisor, fromFarm) ||
            !canManageSupervisorAssignment(requestingUser, supervisor, toFarm)) {
            throw new RuntimeException("You don't have permission to reassign this supervisor");
        }
        
        // Check if supervisor is assigned to source farm
        if (!supervisor.getSupervisedFarms().contains(fromFarm)) {
            throw new RuntimeException("Supervisor is not assigned to the source farm");
        }
        
        // Check if already assigned to target farm
        if (supervisor.getSupervisedFarms().contains(toFarm)) {
            throw new RuntimeException("Supervisor is already assigned to the target farm");
        }
        
        // Remove from source farm and add to target farm
        supervisor.getSupervisedFarms().remove(fromFarm);
        supervisor.getSupervisedFarms().add(toFarm);
        
        // Update primary assigned farm if necessary
        if (supervisor.getAssignedFarm() != null && supervisor.getAssignedFarm().getId().equals(fromFarmId)) {
            supervisor.setAssignedFarm(toFarm);
        }
        
        User savedSupervisor = userRepository.save(supervisor);
        log.info("Supervisor {} reassigned from farm {} to farm {} by {}", 
                supervisor.getUsername(), fromFarm.getName(), toFarm.getName(), requestingUsername);
        
        return savedSupervisor;
    }
    
    public List<User> getSupervisorsForFarm(Long farmId, String requestingUsername) {
        User requestingUser = userRepository.findByUsername(requestingUsername)
                .orElseThrow(() -> new RuntimeException("Requesting user not found"));
        
        // Validate permissions
        if (requestingUser.getRole() != User.Role.SYSTEM_ADMIN && 
            requestingUser.getRole() != User.Role.FARM_OWNER) {
            throw new RuntimeException("You don't have permission to view farm supervisors");
        }
        
        // Verify farm exists
        farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found"));
        
        return userRepository.findSupervisorsByFarmId(farmId);
    }
    
    private boolean canManageSupervisorAssignment(User requestingUser, User supervisor, Farm farm) {
        log.info("Checking permissions for user {} (role: {}) to manage supervisor {} on farm {} (owner: {})", 
                requestingUser.getUsername(), requestingUser.getRole(), 
                supervisor.getUsername(), farm.getName(), 
                farm.getOwner() != null ? farm.getOwner().getUsername() : "null");
        
        // System admin can manage any assignment
        if (requestingUser.getRole() == User.Role.SYSTEM_ADMIN) {
            log.info("Permission granted: System admin");
            return true;
        }
        
        // Farm owner can manage assignments for their own farms
        if (requestingUser.getRole() == User.Role.FARM_OWNER) {
            if (farm.getOwner() == null) {
                log.error("Farm {} has no owner", farm.getName());
                return false;
            }
            
            boolean isOwner = farm.getOwner().getId().equals(requestingUser.getId());
            log.info("Permission check result: {} (requesting user ID: {}, farm owner ID: {})", 
                    isOwner, requestingUser.getId(), farm.getOwner().getId());
            return isOwner;
        }
        
        log.info("Permission denied: User role {} not authorized", requestingUser.getRole());
        return false;
    }
}