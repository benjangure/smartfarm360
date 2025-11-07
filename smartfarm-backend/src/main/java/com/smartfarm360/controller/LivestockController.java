package com.smartfarm360.controller;

import com.smartfarm360.model.Livestock;
import com.smartfarm360.service.LivestockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/livestock")
@RequiredArgsConstructor
@Tag(name = "Livestock", description = "Livestock management APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class LivestockController {
    
    private final LivestockService livestockService;
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Create livestock", description = "Create a new livestock entry")
    public ResponseEntity<Livestock> createLivestock(@Valid @RequestBody Livestock livestock) {
        Livestock savedLivestock = livestockService.createLivestock(livestock);
        return ResponseEntity.ok(savedLivestock);
    }
    
    @GetMapping
    @Operation(summary = "Get all livestock", description = "Get all livestock")
    public ResponseEntity<List<Livestock>> getAllLivestock() {
        List<Livestock> livestock = livestockService.getAllLivestock();
        return ResponseEntity.ok(livestock);
    }
    
    @GetMapping("/farm/{farmId}")
    @Operation(summary = "Get livestock by farm", description = "Get all livestock for a specific farm")
    public ResponseEntity<List<Livestock>> getLivestockByFarm(@PathVariable Long farmId) {
        List<Livestock> livestock = livestockService.getLivestockByFarm(farmId);
        return ResponseEntity.ok(livestock);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get livestock by ID", description = "Get livestock details by ID")
    public ResponseEntity<Livestock> getLivestockById(@PathVariable Long id) {
        Livestock livestock = livestockService.getLivestockById(id);
        return ResponseEntity.ok(livestock);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Update livestock", description = "Update livestock details")
    public ResponseEntity<Livestock> updateLivestock(@PathVariable Long id, @Valid @RequestBody Livestock livestock) {
        Livestock updatedLivestock = livestockService.updateLivestock(id, livestock);
        return ResponseEntity.ok(updatedLivestock);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @Operation(summary = "Delete livestock", description = "Delete a livestock entry")
    public ResponseEntity<?> deleteLivestock(@PathVariable Long id) {
        livestockService.deleteLivestock(id);
        return ResponseEntity.ok().body("Livestock deleted successfully");
    }
}