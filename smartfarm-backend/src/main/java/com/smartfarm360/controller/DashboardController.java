package com.smartfarm360.controller;

import com.smartfarm360.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DashboardController {
    
    private final DashboardService dashboardService;
    
    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics", description = "Get role-based dashboard statistics")
    public ResponseEntity<Map<String, Object>> getDashboardStats(Authentication authentication) {
        Map<String, Object> stats = dashboardService.getDashboardStats(authentication);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/admin/stats")
    @Operation(summary = "Get admin dashboard statistics", description = "Get comprehensive admin dashboard statistics")
    public ResponseEntity<Map<String, Object>> getAdminDashboardStats() {
        Map<String, Object> stats = dashboardService.getAdminDashboardStats();
        return ResponseEntity.ok(stats);
    }
}