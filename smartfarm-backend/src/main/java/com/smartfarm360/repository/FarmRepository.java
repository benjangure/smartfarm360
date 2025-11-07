package com.smartfarm360.repository;

import com.smartfarm360.model.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long> {
    
    List<Farm> findByNameContainingIgnoreCase(String name);
    
    List<Farm> findByLocationContainingIgnoreCase(String location);
    
    @Query("SELECT f FROM Farm f LEFT JOIN FETCH f.assignedUsers WHERE f.id = :id")
    Farm findByIdWithUsers(Long id);
    
    @Query("SELECT f FROM Farm f LEFT JOIN FETCH f.owner WHERE f.id = :id")
    Farm findByIdWithOwner(Long id);
}