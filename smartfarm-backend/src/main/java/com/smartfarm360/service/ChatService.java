package com.smartfarm360.service;

import com.smartfarm360.model.ChatMessage;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.ChatMessageRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    @Transactional
    public ChatMessage saveMessage(ChatMessage message, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Authentication is required");
        }
        
        User sender = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        message.setSender(sender);
        ChatMessage savedMessage = chatMessageRepository.save(message);
        
        // Broadcast message to all connected clients
        messagingTemplate.convertAndSend("/topic/public", savedMessage);
        
        log.info("Message saved and broadcasted from user: {}", sender.getUsername());
        return savedMessage;
    }
    
    public List<ChatMessage> getRecentMessages(int limit) {
        return chatMessageRepository.findRecentMessages(limit);
    }
    
    public List<ChatMessage> getAllMessages() {
        return chatMessageRepository.findAllOrderByCreatedAtDesc();
    }
}