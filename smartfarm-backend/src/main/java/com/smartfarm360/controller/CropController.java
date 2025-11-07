package com.smartfarm360.controller;

import com.smartfarm360.model.Crop;
import com.smartfarm360.service.CropService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
@RequiredArgsConstructor
@Tag(name = "Crops", description = "Crop management APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CropController {
    
    private final CropService cropService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Create crop", description = "Create a new crop")
    public ResponseEntity<Crop> createCrop(@Valid @RequestBody Crop crop) {
        Crop savedCrop = cropService.createCrop(crop);
        return ResponseEntity.ok(savedCrop);
    }
    
    @GetMapping
    @Operation(summary = "Get all crops", description = "Get all crops")
    public ResponseEntity<List<Crop>> getAllCrops() {
        List<Crop> crops = cropService.getAllCrops();
        return ResponseEntity.ok(crops);
    }
    
    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get crops by farm", description = "Get all crops for a specific farm")
    public ResponseEntity<List<Crop>> getCropsByFarm(@PathVariable Long farmId) {
        List<Crop> crops = cropService.getCropsByFarm(farmId);
        return ResponseEntity.ok(crops);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get crop by ID", description = "Get crop details by ID")
    public ResponseEntity<Crop> getCropById(@PathVariable Long id) {
        Crop crop = cropService.getCropById(id);
        return ResponseEntity.ok(crop);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Update crop", description = "Update crop details")
    public ResponseEntity<Crop> updateCrop(@PathVariable Long id, @Valid @RequestBody Crop crop) {
        Crop updatedCrop = cropService.updateCrop(id, crop);
        return ResponseEntity.ok(updatedCrop);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Delete crop", description = "Delete a crop")
    public ResponseEntity<?> deleteCrop(@PathVariable Long id) {
        cropService.deleteCrop(id);
        return ResponseEntity.ok().body("Crop deleted successfully");
    }
}