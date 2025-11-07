package com.smartfarm360.repository;

import com.smartfarm360.model.Livestock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LivestockRepository extends JpaRepository<Livestock, Long> {
    
    List<Livestock> findByFarmId(Long farmId);
    
    List<Livestock> findByType(String type);
    
    List<Livestock> findByHealthStatus(Livestock.HealthStatus healthStatus);
    
    List<Livestock> findByFarmIdAndIsActiveTrue(Long farmId);
}