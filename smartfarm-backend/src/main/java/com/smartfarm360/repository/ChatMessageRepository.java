package com.smartfarm360.repository;

import com.smartfarm360.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    @Query("SELECT c FROM ChatMessage c ORDER BY c.createdAt DESC")
    List<ChatMessage> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT c FROM ChatMessage c WHERE c.createdAt >= :since ORDER BY c.createdAt ASC")
    List<ChatMessage> findMessagesSince(@Param("since") LocalDateTime since);
    
    @Query("SELECT c FROM ChatMessage c ORDER BY c.createdAt DESC LIMIT :limit")
    List<ChatMessage> findRecentMessages(@Param("limit") int limit);
}