package com.smartfarm360.dto;

import com.smartfarm360.model.Message;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long id;
    private String content;
    private String messageType;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private UserSummary sender;
    private UserSummary recipient;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
    }
    
    public static MessageResponse fromMessage(Message message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setContent(message.getContent());
        response.setMessageType(message.getMessageType().toString());
        response.setIsRead(message.getIsRead());
        response.setCreatedAt(message.getCreatedAt());
        
        // Sender
        UserSummary sender = new UserSummary();
        sender.setId(message.getSender().getId());
        sender.setFirstName(message.getSender().getFirstName());
        sender.setLastName(message.getSender().getLastName());
        sender.setEmail(message.getSender().getEmail());
        sender.setRole(message.getSender().getRole().toString());
        response.setSender(sender);
        
        // Recipient
        UserSummary recipient = new UserSummary();
        recipient.setId(message.getRecipient().getId());
        recipient.setFirstName(message.getRecipient().getFirstName());
        recipient.setLastName(message.getRecipient().getLastName());
        recipient.setEmail(message.getRecipient().getEmail());
        recipient.setRole(message.getRecipient().getRole().toString());
        response.setRecipient(recipient);
        
        return response;
    }
}