package com.smartfarm360.controller;

import com.smartfarm360.dto.FarmOwnerReport;
import com.smartfarm360.dto.FarmResponse;
import com.smartfarm360.model.Farm;
import com.smartfarm360.service.FarmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Farm Management", description = "Farm management APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    @Operation(summary = "Get farms", description = "Get farms based on user role")
    public ResponseEntity<List<FarmResponse>> getFarms(Authentication authentication) {
        List<Farm> farms = farmService.getFarmsForCurrentUser(authentication.getName());
        List<FarmResponse> farmResponses = farmService.convertToDtoList(farms);
        return ResponseEntity.ok(farmResponses);
    }

    @GetMapping("/my-farms")
    @Operation(summary = "Get my farms", description = "Get farms owned/managed by current user")
    public ResponseEntity<List<FarmResponse>> getMyFarms(Authentication authentication) {
        try {
            log.info("Getting farms for user: {}", authentication.getName());
            log.info("Authentication object: {}", authentication.getClass().getSimpleName());
            log.info("User authorities: {}", authentication.getAuthorities());
            
            List<Farm> farms = farmService.getFarmsForCurrentUser(authentication.getName());
            log.info("Found {} farms for user", farms.size());
            
            List<FarmResponse> farmResponses = farmService.convertToDtoList(farms);
            return ResponseEntity.ok(farmResponses);
        } catch (Exception e) {
            log.error("Error getting farms for user {}: {}", authentication.getName(), e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get farm by ID", description = "Get farm details by ID")
    public ResponseEntity<FarmResponse> getFarmById(@PathVariable Long id, Authentication authentication) {
        return farmService.getFarmById(id, authentication.getName())
                .map(farm -> ResponseEntity.ok(farmService.convertToDto(farm)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create farm", description = "Create a new farm")
    public ResponseEntity<?> createFarm(@RequestBody Farm farm, Authentication authentication) {
        try {
            log.info("Creating farm: {} for user: {}", farm.getName(), authentication.getName());
            Farm createdFarm = farmService.createFarm(farm, authentication.getName());
            log.info("Farm created with ID: {}", createdFarm.getId());

            // Use the service method to convert to DTO
            FarmResponse response = farmService.convertToDto(createdFarm);

            log.info("Returning farm response: {}", response.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error creating farm: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error creating farm: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Internal server error");
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update farm", description = "Update farm details")
    public ResponseEntity<?> updateFarm(@PathVariable Long id, @RequestBody Farm farm, Authentication authentication) {
        try {
            Farm updatedFarm = farmService.updateFarm(id, farm, authentication.getName());

            // Use the service method to convert to DTO
            FarmResponse response = farmService.convertToDto(updatedFarm);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete farm", description = "Delete a farm")
    public ResponseEntity<?> deleteFarm(@PathVariable Long id, Authentication authentication) {
        try {
            farmService.deleteFarm(id, authentication.getName());
            return ResponseEntity.ok().body("Farm deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/test-auth")
    @Operation(summary = "Test authentication", description = "Test if authentication is working")
    public ResponseEntity<?> testAuth(Authentication authentication) {
        try {
            log.info("Auth test - User: {}", authentication.getName());
            log.info("Auth test - Authorities: {}", authentication.getAuthorities());
            
            return ResponseEntity.ok().body("Authentication working for user: " + authentication.getName());
        } catch (Exception e) {
            log.error("Auth test failed: {}", e.getMessage());
            return ResponseEntity.status(500).body("Auth test failed: " + e.getMessage());
        }
    }

    // Admin-only endpoints for oversight
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Get all farms for admin oversight", description = "Get all farms in the system (System Admin only)")
    public ResponseEntity<List<FarmResponse>> getAllFarmsForAdmin(Authentication authentication) {
        try {
            List<Farm> farms = farmService.getAllFarmsForAdmin(authentication.getName());
            List<FarmResponse> farmResponses = farmService.convertToDtoList(farms);
            return ResponseEntity.ok(farmResponses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/admin/reports")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Get farm owner reports", description = "Get comprehensive reports about all farm owners (System Admin only)")
    public ResponseEntity<List<FarmOwnerReport>> getFarmOwnerReports(Authentication authentication) {
        try {
            List<FarmOwnerReport> reports = farmService.getFarmOwnerReports(authentication.getName());
            return ResponseEntity.ok(reports);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}