package com.smartfarm360.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    @JsonIgnore
    private String password;
    
    @Column(name = "first_name", nullable = false)
    private String firstName;
    
    @Column(name = "last_name", nullable = false)
    private String lastName;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_farm_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "owner", "assignedUsers", "crops", "livestock"})
    private Farm assignedFarm;
    
    // For supervisors who can be assigned to multiple farms (max 2)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "supervisor_farm_assignments",
        joinColumns = @JoinColumn(name = "supervisor_id"),
        inverseJoinColumns = @JoinColumn(name = "farm_id")
    )
    @JsonIgnoreProperties({"owner", "assignedUsers", "crops", "livestock"})
    private List<Farm> supervisedFarms = new ArrayList<>();
    
    // For farm owners who can own multiple farms
    @OneToMany(mappedBy = "owner", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"owner", "assignedUsers", "crops", "livestock"})
    private List<Farm> ownedFarms = new ArrayList<>();
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "must_change_password")
    private Boolean mustChangePassword = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
    
    @Override
    public String getUsername() {
        return username;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return isActive;
    }
    
    public enum Role {
        SYSTEM_ADMIN,  // System administrator (you)
        FARM_OWNER,    // Farm owner (approved applicants)
        SUPERVISOR,    // Farm supervisors (created by farm owners)
        WORKER         // Farm workers (created by supervisors)
    }
}