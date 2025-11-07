package com.smartfarm360.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FarmOwnerReport {
    private Long farmOwnerId;
    private String farmOwnerName;
    private String email;
    private String phoneNumber;
    private int totalFarms;
    private int totalSupervisors;
    private int totalWorkers;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private List<FarmSummary> farms;
}