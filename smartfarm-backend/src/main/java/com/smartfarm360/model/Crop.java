package com.smartfarm360.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "crops")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Crop {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String variety;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;
    
    @Column(name = "planting_date")
    private LocalDate plantingDate;
    
    @Column(name = "expected_harvest_date")
    private LocalDate expectedHarvestDate;
    
    @Column(name = "actual_harvest_date")
    private LocalDate actualHarvestDate;
    
    @Column(name = "area_planted", precision = 10, scale = 2)
    private BigDecimal areaPlanted; // in hectares
    
    @Column(name = "expected_yield", precision = 10, scale = 2)
    private BigDecimal expectedYield; // in tons
    
    @Column(name = "actual_yield", precision = 10, scale = 2)
    private BigDecimal actualYield; // in tons
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CropStatus status = CropStatus.PLANTED;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
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
    
    public enum CropStatus {
        PLANTED, GROWING, READY_FOR_HARVEST, HARVESTED, FAILED
    }
}