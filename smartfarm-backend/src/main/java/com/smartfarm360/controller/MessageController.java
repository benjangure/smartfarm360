package com.smartfarm360.controller;

import com.smartfarm360.dto.MessageRequest;
import com.smartfarm360.dto.MessageResponse;
import com.smartfarm360.model.Message;
import com.smartfarm360.model.User;
import com.smartfarm360.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Message Management", description = "Messaging system APIs")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MessageController {
    
    private final MessageService messageService;
    
    @PostMapping("/send")
    @Operation(summary = "Send message", description = "Send a message to another user")
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request, Authentication authentication) {
        try {
            Message message = messageService.sendMessage(
                    authentication.getName(),
                    request.getRecipientId(),
                    request.getContent(),
                    request.getMessageType() != null ? request.getMessageType() : Message.MessageType.TEXT
            );
            
            return ResponseEntity.ok(MessageResponse.fromMessage(message));
        } catch (RuntimeException e) {
            log.error("Error sending message: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/conversation/{otherUserId}")
    @Operation(summary = "Get conversation", description = "Get conversation with another user")
    public ResponseEntity<?> getConversation(@PathVariable Long otherUserId, Authentication authentication) {
        try {
            List<Message> messages = messageService.getConversation(authentication.getName(), otherUserId);
            List<MessageResponse> messageResponses = messages.stream()
                    .map(MessageResponse::fromMessage)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(messageResponses);
        } catch (RuntimeException e) {
            log.error("Error getting conversation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/contacts")
    @Operation(summary = "Get available contacts", description = "Get list of users current user can message")
    public ResponseEntity<?> getAvailableContacts(Authentication authentication) {
        try {
            List<User> contacts = messageService.getAvailableContacts(authentication.getName());
            // Convert to simple user responses to avoid circular references
            List<Object> contactResponses = contacts.stream()
                    .map(user -> {
                        return new Object() {
                            public final Long id = user.getId();
                            public final String firstName = user.getFirstName();
                            public final String lastName = user.getLastName();
                            public final String email = user.getEmail();
                            public final String role = user.getRole().toString();
                        };
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(contactResponses);
        } catch (RuntimeException e) {
            log.error("Error getting contacts: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/conversations")
    @Operation(summary = "Get user conversations", description = "Get all conversations for current user")
    public ResponseEntity<?> getUserConversations(Authentication authentication) {
        try {
            List<Message> conversations = messageService.getUserConversations(authentication.getName());
            List<MessageResponse> conversationResponses = conversations.stream()
                    .map(MessageResponse::fromMessage)
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(conversationResponses);
        } catch (RuntimeException e) {
            log.error("Error getting conversations: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/unread-count")
    @Operation(summary = "Get unread count", description = "Get count of unread messages")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        try {
            Long unreadCount = messageService.getUnreadCount(authentication.getName());
            return ResponseEntity.ok(unreadCount);
        } catch (RuntimeException e) {
            log.error("Error getting unread count: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/mark-read/{otherUserId}")
    @Operation(summary = "Mark conversation as read", description = "Mark all messages in conversation as read")
    public ResponseEntity<?> markConversationAsRead(@PathVariable Long otherUserId, Authentication authentication) {
        try {
            messageService.markConversationAsRead(authentication.getName(), otherUserId);
            return ResponseEntity.ok("Conversation marked as read");
        } catch (RuntimeException e) {
            log.error("Error marking conversation as read: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}