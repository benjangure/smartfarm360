package com.smartfarm360.repository;

import com.smartfarm360.model.Message;
import com.smartfarm360.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Get conversation between two users
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :userId1 AND m.recipient.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.recipient.id = :userId1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversationBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
    
    // Get all conversations for a user (latest message from each conversation)
    @Query("SELECT m FROM Message m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM Message m2 WHERE " +
           "m2.sender.id = :userId OR m2.recipient.id = :userId " +
           "GROUP BY CASE " +
           "WHEN m2.sender.id = :userId THEN m2.recipient.id " +
           "ELSE m2.sender.id END) " +
           "ORDER BY m.createdAt DESC")
    List<Message> findLatestConversationsForUser(@Param("userId") Long userId);
    
    // Count unread messages for a user
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipient.id = :userId AND m.isRead = false")
    Long countUnreadMessagesForUser(@Param("userId") Long userId);
    
    // Get unread messages for a user
    @Query("SELECT m FROM Message m WHERE m.recipient.id = :userId AND m.isRead = false ORDER BY m.createdAt DESC")
    List<Message> findUnreadMessagesForUser(@Param("userId") Long userId);
    
    // Mark messages as read
    @Query("UPDATE Message m SET m.isRead = true WHERE m.recipient.id = :userId AND " +
           "((m.sender.id = :otherUserId AND m.recipient.id = :userId) OR " +
           "(m.sender.id = :userId AND m.recipient.id = :otherUserId))")
    void markConversationAsRead(@Param("userId") Long userId, @Param("otherUserId") Long otherUserId);
}