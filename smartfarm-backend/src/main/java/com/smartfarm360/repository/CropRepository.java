package com.smartfarm360.repository;

import com.smartfarm360.model.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CropRepository extends JpaRepository<Crop, Long> {
    
    List<Crop> findByFarmId(Long farmId);
    
    List<Crop> findByStatus(Crop.CropStatus status);
    
    List<Crop> findByFarmIdAndStatus(Long farmId, Crop.CropStatus status);
}