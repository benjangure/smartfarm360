package com.smartfarm360.service;

import com.smartfarm360.model.Livestock;
import com.smartfarm360.repository.LivestockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LivestockService {
    
    private final LivestockRepository livestockRepository;
    
    public Livestock createLivestock(Livestock livestock) {
        return livestockRepository.save(livestock);
    }
    
    public List<Livestock> getAllLivestock() {
        return livestockRepository.findAll();
    }
    
    public List<Livestock> getLivestockByFarm(Long farmId) {
        return livestockRepository.findByFarmId(farmId);
    }
    
    public Livestock getLivestockById(Long id) {
        return livestockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Livestock not found with id: " + id));
    }
    
    public Livestock updateLivestock(Long id, Livestock livestockDetails) {
        Livestock livestock = getLivestockById(id);
        
        livestock.setType(livestockDetails.getType());
        livestock.setBreed(livestockDetails.getBreed());
        livestock.setTagNumber(livestockDetails.getTagNumber());
        livestock.setGender(livestockDetails.getGender());
        livestock.setWeight(livestockDetails.getWeight());
        livestock.setHealthStatus(livestockDetails.getHealthStatus());
        livestock.setBirthDate(livestockDetails.getBirthDate());
        livestock.setVaccinationDate(livestockDetails.getVaccinationDate());
        livestock.setNextVaccinationDate(livestockDetails.getNextVaccinationDate());
        livestock.setPurchaseDate(livestockDetails.getPurchaseDate());
        livestock.setPurchasePrice(livestockDetails.getPurchasePrice());
        livestock.setCurrentValue(livestockDetails.getCurrentValue());
        livestock.setNotes(livestockDetails.getNotes());
        livestock.setIsActive(livestockDetails.getIsActive());
        
        return livestockRepository.save(livestock);
    }
    
    public void deleteLivestock(Long id) {
        Livestock livestock = getLivestockById(id);
        livestockRepository.delete(livestock);
    }
}