package com.smartfarm360.service;

import com.smartfarm360.model.Crop;
import com.smartfarm360.repository.CropRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CropService {
    
    private final CropRepository cropRepository;
    
    public Crop createCrop(Crop crop) {
        return cropRepository.save(crop);
    }
    
    public List<Crop> getAllCrops() {
        return cropRepository.findAll();
    }
    
    public List<Crop> getCropsByFarm(Long farmId) {
        return cropRepository.findByFarmId(farmId);
    }
    
    public Crop getCropById(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crop not found with id: " + id));
    }
    
    public Crop updateCrop(Long id, Crop cropDetails) {
        Crop crop = getCropById(id);
        
        crop.setName(cropDetails.getName());
        crop.setVariety(cropDetails.getVariety());
        crop.setDescription(cropDetails.getDescription());
        crop.setPlantingDate(cropDetails.getPlantingDate());
        crop.setExpectedHarvestDate(cropDetails.getExpectedHarvestDate());
        crop.setActualHarvestDate(cropDetails.getActualHarvestDate());
        crop.setAreaPlanted(cropDetails.getAreaPlanted());
        crop.setExpectedYield(cropDetails.getExpectedYield());
        crop.setActualYield(cropDetails.getActualYield());
        crop.setStatus(cropDetails.getStatus());
        crop.setNotes(cropDetails.getNotes());
        
        return cropRepository.save(crop);
    }
    
    public void deleteCrop(Long id) {
        Crop crop = getCropById(id);
        cropRepository.delete(crop);
    }
}