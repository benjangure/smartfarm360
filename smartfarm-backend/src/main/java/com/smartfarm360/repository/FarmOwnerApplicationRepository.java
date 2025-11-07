package com.smartfarm360.repository;

import com.smartfarm360.model.FarmOwnerApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmOwnerApplicationRepository extends JpaRepository<FarmOwnerApplication, Long> {
    
    List<FarmOwnerApplication> findByStatus(FarmOwnerApplication.ApplicationStatus status);
    
    Optional<FarmOwnerApplication> findByEmail(String email);
    
    List<FarmOwnerApplication> findByStatusOrderByCreatedAtDesc(FarmOwnerApplication.ApplicationStatus status);
    
    List<FarmOwnerApplication> findAllByOrderByCreatedAtDesc();
}