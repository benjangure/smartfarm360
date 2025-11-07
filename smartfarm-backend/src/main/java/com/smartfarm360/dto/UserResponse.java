package com.smartfarm360.dto;

import com.smartfarm360.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private User.Role role;
    private String farmName;
    private Long farmId;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer farmCount; // Number of farms owned by this user
    private List<SimpleFarm> supervisedFarms; // Farms supervised by this user (for supervisors)
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleFarm {
        private Long id;
        private String name;
        private String location;
    }
    
    public static UserResponse fromUser(User user) {
        if (user == null) {
            return null;
        }
        
        // Create a safe response with null checks
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername() != null ? user.getUsername() : "");
        response.setEmail(user.getEmail() != null ? user.getEmail() : "");
        response.setFirstName(user.getFirstName() != null ? user.getFirstName() : "");
        response.setLastName(user.getLastName() != null ? user.getLastName() : "");
        response.setPhoneNumber(user.getPhoneNumber());
        response.setRole(user.getRole());
        response.setFarmName(null); // farmName - avoid lazy loading
        response.setFarmId(null); // farmId - avoid lazy loading  
        response.setIsActive(user.getIsActive() != null ? user.getIsActive() : true);
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        
        // Calculate farm count for farm owners
        if (user.getRole() == User.Role.FARM_OWNER && user.getOwnedFarms() != null) {
            response.setFarmCount(user.getOwnedFarms().size());
        } else {
            response.setFarmCount(0);
        }
        
        // Add supervised farms for supervisors
        if (user.getRole() == User.Role.SUPERVISOR && user.getSupervisedFarms() != null) {
            List<SimpleFarm> supervisedFarmSummaries = new ArrayList<>();
            for (var farm : user.getSupervisedFarms()) {
                SimpleFarm simpleFarm = new SimpleFarm();
                simpleFarm.setId(farm.getId());
                simpleFarm.setName(farm.getName());
                simpleFarm.setLocation(farm.getLocation());
                supervisedFarmSummaries.add(simpleFarm);
            }
            response.setSupervisedFarms(supervisedFarmSummaries);
        } else {
            response.setSupervisedFarms(new ArrayList<>());
        }
        
        return response;
    }
}