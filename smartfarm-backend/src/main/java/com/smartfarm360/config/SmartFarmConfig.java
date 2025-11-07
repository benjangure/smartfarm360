package com.smartfarm360.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "smartfarm")
@Data
public class SmartFarmConfig {
    
    private Admin admin = new Admin();
    
    @Data
    public static class Admin {
        private String email = "ngurebenjamin5@gmail.com";
    }
}