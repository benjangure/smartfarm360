package com.smartfarm360.dto;

import com.smartfarm360.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private User.Role role;
    private Long farmId;
    private String farmName;
    private Boolean mustChangePassword;
    
    public JwtResponse(String token, Long id, String username, String email, 
                     String firstName, String lastName, User.Role role, 
                     Long farmId, String farmName) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.farmId = farmId;
        this.farmName = farmName;
        this.mustChangePassword = false;
    }
    
    public JwtResponse(String token, Long id, String username, String email, 
                     String firstName, String lastName, User.Role role, 
                     Long farmId, String farmName, Boolean mustChangePassword) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.farmId = farmId;
        this.farmName = farmName;
        this.mustChangePassword = mustChangePassword;
    }
}