package com.smartfarm360.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "livestock")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Livestock {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String type; // cattle, sheep, goats, pigs, chickens, etc.
    
    @Column(nullable = false)
    private String breed;
    
    @Column(name = "tag_number", unique = true)
    private String tagNumber;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;
    
    @Column(name = "birth_date")
    private LocalDate birthDate;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    @Column(precision = 6, scale = 2)
    private BigDecimal weight; // in kg
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HealthStatus healthStatus = HealthStatus.HEALTHY;
    
    @Column(name = "vaccination_date")
    private LocalDate vaccinationDate;
    
    @Column(name = "next_vaccination_date")
    private LocalDate nextVaccinationDate;
    
    @Column(name = "purchase_date")
    private LocalDate purchaseDate;
    
    @Column(name = "purchase_price", precision = 10, scale = 2)
    private BigDecimal purchasePrice;
    
    @Column(name = "current_value", precision = 10, scale = 2)
    private BigDecimal currentValue;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
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
    
    public enum Gender {
        MALE, FEMALE
    }
    
    public enum HealthStatus {
        HEALTHY, SICK, UNDER_TREATMENT, QUARANTINED, DECEASED
    }
}