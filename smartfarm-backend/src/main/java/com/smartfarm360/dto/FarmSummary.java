package com.smartfarm360.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FarmSummary {
    private Long farmId;
    private String farmName;
    private String location;
    private BigDecimal size;
    private String sizeUnit;
    private int supervisorCount;
    private int workerCount;
    private int activeTaskCount;
    private LocalDateTime createdAt;
}