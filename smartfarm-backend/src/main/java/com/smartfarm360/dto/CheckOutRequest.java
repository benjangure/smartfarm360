package com.smartfarm360.dto;

import lombok.Data;

@Data
public class CheckOutRequest {
    
    private String location;
    
    private String notes;
}