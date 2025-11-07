package com.smartfarm360.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FarmResponse {
    private Long id;
    private String name;
    private String description;
    private String location;
    private BigDecimal size;
    private String sizeUnit;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private OwnerInfo owner;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnerInfo {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
    }
}