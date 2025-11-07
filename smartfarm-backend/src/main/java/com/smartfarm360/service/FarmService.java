package com.smartfarm360.service;

import com.smartfarm360.dto.FarmOwnerReport;
import com.smartfarm360.dto.FarmResponse;
import com.smartfarm360.dto.FarmSummary;
import com.smartfarm360.model.Farm;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.FarmRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FarmService {
    
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    
    public List<Farm> getFarmsForCurrentUser(String username) {
        log.info("Getting farms for username: {}", username);
        
        if (username == null) {
            log.error("Username is null");
            throw new RuntimeException("Authentication is required");
        }
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.error("User not found: {}", username);
                    return new RuntimeException("User not found");
                });
        
        log.info("Found user: {} with role: {}", user.getUsername(), user.getRole());
        
        switch (user.getRole()) {
            case SYSTEM_ADMIN:
                return farmRepository.findAll();
            case FARM_OWNER:
                // Farm owner can see all their owned farms
                List<Farm> farms = new ArrayList<>(user.getOwnedFarms());
                if (user.getAssignedFarm() != null) {
                    farms.add(user.getAssignedFarm());
                }
                return farms.stream().distinct().toList();
            case SUPERVISOR:
            case WORKER:
                // Can only see their assigned farm
                if (user.getAssignedFarm() != null) {
                    return List.of(user.getAssignedFarm());
                }
                return List.of();
            default:
                return List.of();
        }
    }
    
    @Transactional
    public Farm createFarm(Farm farm, String ownerUsername) {
        if (ownerUsername == null) {
            throw new RuntimeException("Authentication is required");
        }
        
        User owner = userRepository.findByUsername(ownerUsername)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        // Only farm owners can create farms
        if (owner.getRole() != User.Role.FARM_OWNER) {
            throw new RuntimeException("Only farm owners can create farms");
        }
        
        // Validate farm data
        if (farm.getName() == null || farm.getName().trim().isEmpty()) {
            throw new RuntimeException("Farm name is required");
        }
        if (farm.getLocation() == null || farm.getLocation().trim().isEmpty()) {
            throw new RuntimeException("Farm location is required");
        }
        if (farm.getSize() == null || farm.getSize().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Farm size must be greater than 0");
        }
        
        farm.setOwner(owner);
        farm.setCreatedAt(LocalDateTime.now());
        farm.setUpdatedAt(LocalDateTime.now());
        
        Farm savedFarm = farmRepository.save(farm);
        
        log.info("Farm {} created by {}", savedFarm.getName(), ownerUsername);
        return savedFarm;
    }
    
    public Optional<Farm> getFarmById(Long farmId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Optional<Farm> farm = farmRepository.findById(farmId);
        
        if (farm.isEmpty()) {
            return Optional.empty();
        }
        
        // Validate access to this farm
        if (!canAccessFarm(user, farm.get())) {
            throw new RuntimeException("You don't have access to this farm");
        }
        
        return farm;
    }
    
    @Transactional
    public Farm updateFarm(Long farmId, Farm updatedFarm, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found"));
        
        // Only farm owner can update their own farm
        if (!canManageFarm(user, farm)) {
            throw new RuntimeException("You can only update farms that you own");
        }
        
        // Validate updated farm data
        if (updatedFarm.getName() == null || updatedFarm.getName().trim().isEmpty()) {
            throw new RuntimeException("Farm name is required");
        }
        if (updatedFarm.getLocation() == null || updatedFarm.getLocation().trim().isEmpty()) {
            throw new RuntimeException("Farm location is required");
        }
        if (updatedFarm.getSize() == null || updatedFarm.getSize().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Farm size must be greater than 0");
        }
        
        farm.setName(updatedFarm.getName().trim());
        farm.setDescription(updatedFarm.getDescription() != null ? updatedFarm.getDescription().trim() : null);
        farm.setLocation(updatedFarm.getLocation().trim());
        farm.setSize(updatedFarm.getSize());
        farm.setSizeUnit(updatedFarm.getSizeUnit() != null ? updatedFarm.getSizeUnit() : "hectares");
        farm.setUpdatedAt(LocalDateTime.now());
        
        Farm savedFarm = farmRepository.save(farm);
        log.info("Farm {} updated by {}", savedFarm.getName(), username);
        return savedFarm;
    }
    
    @Transactional
    public void deleteFarm(Long farmId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new RuntimeException("Farm not found"));
        
        // Only farm owner can delete their own farm
        if (!canManageFarm(user, farm)) {
            throw new RuntimeException("You can only delete farms that you own");
        }
        
        // Check if farm has assigned users and reassign them to null
        if (farm.getAssignedUsers() != null && !farm.getAssignedUsers().isEmpty()) {
            log.info("Reassigning {} users from farm {} before deletion", 
                    farm.getAssignedUsers().size(), farm.getName());
            
            // Reassign all users to no farm
            for (User assignedUser : farm.getAssignedUsers()) {
                assignedUser.setAssignedFarm(null);
                userRepository.save(assignedUser);
            }
        }
        
        farmRepository.delete(farm);
        log.info("Farm {} deleted by {}", farm.getName(), username);
    }
    
    private boolean canAccessFarm(User user, Farm farm) {
        switch (user.getRole()) {
            case SYSTEM_ADMIN:
                return true;
            case FARM_OWNER:
                return farm.getOwner().getId().equals(user.getId()) ||
                       (user.getAssignedFarm() != null && user.getAssignedFarm().getId().equals(farm.getId()));
            case SUPERVISOR:
            case WORKER:
                return user.getAssignedFarm() != null && user.getAssignedFarm().getId().equals(farm.getId());
            default:
                return false;
        }
    }
    
    private boolean canManageFarm(User user, Farm farm) {
        // Only farm owners can manage farms, and only their own farms
        return user.getRole() == User.Role.FARM_OWNER && 
               farm.getOwner().getId().equals(user.getId());
    }
    
    // Admin oversight methods
    public List<Farm> getAllFarmsForAdmin(String username) {
        if (username == null) {
            throw new RuntimeException("Authentication is required");
        }
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Only system admin can access all farms for oversight
        if (user.getRole() != User.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Only system administrators can access all farms");
        }
        
        return farmRepository.findAll();
    }
    
    public List<FarmOwnerReport> getFarmOwnerReports(String username) {
        if (username == null) {
            throw new RuntimeException("Authentication is required");
        }
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Only system admin can access farm owner reports
        if (user.getRole() != User.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Only system administrators can access farm owner reports");
        }
        
        // Get all farm owners
        List<User> farmOwners = userRepository.findByRole(User.Role.FARM_OWNER);
        
        return farmOwners.stream().map(farmOwner -> {
            List<Farm> ownedFarms = farmOwner.getOwnedFarms();
            
            // Calculate statistics
            int totalSupervisors = ownedFarms.stream()
                .mapToInt(farm -> farm.getAssignedUsers().size())
                .sum();
            
            int totalWorkers = ownedFarms.stream()
                .mapToInt(farm -> (int) farm.getAssignedUsers().stream()
                    .filter(u -> u.getRole() == User.Role.WORKER)
                    .count())
                .sum();
            
            // Create farm summaries
            List<FarmSummary> farmSummaries = ownedFarms.stream()
                .map(farm -> new FarmSummary(
                    farm.getId(),
                    farm.getName(),
                    farm.getLocation(),
                    farm.getSize(),
                    farm.getSizeUnit(),
                    (int) farm.getAssignedUsers().stream()
                        .filter(u -> u.getRole() == User.Role.SUPERVISOR)
                        .count(),
                    (int) farm.getAssignedUsers().stream()
                        .filter(u -> u.getRole() == User.Role.WORKER)
                        .count(),
                    0, // TODO: Add active task count when task repository is available
                    farm.getCreatedAt()
                ))
                .toList();
            
            return new FarmOwnerReport(
                farmOwner.getId(),
                farmOwner.getFirstName() + " " + farmOwner.getLastName(),
                farmOwner.getEmail(),
                farmOwner.getPhoneNumber(),
                ownedFarms.size(),
                totalSupervisors,
                totalWorkers,
                null, // TODO: Add last login tracking
                farmOwner.getCreatedAt(),
                farmSummaries
            );
        }).toList();
    }
    
    // Helper method to convert Farm entity to DTO
    public FarmResponse convertToDto(Farm farm) {
        return new FarmResponse(
            farm.getId(),
            farm.getName(),
            farm.getDescription(),
            farm.getLocation(),
            farm.getSize(),
            farm.getSizeUnit(),
            farm.getCreatedAt(),
            farm.getUpdatedAt(),
            farm.getOwner() != null ? new FarmResponse.OwnerInfo(
                farm.getOwner().getId(),
                farm.getOwner().getFirstName(),
                farm.getOwner().getLastName(),
                farm.getOwner().getEmail()
            ) : null
        );
    }
    
    // Convert list of farms to DTOs
    public List<FarmResponse> convertToDtoList(List<Farm> farms) {
        return farms.stream()
            .map(this::convertToDto)
            .toList();
    }
}