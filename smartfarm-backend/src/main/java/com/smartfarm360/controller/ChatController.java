package com.smartfarm360.controller;

import com.smartfarm360.model.ChatMessage;
import com.smartfarm360.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Chat management APIs")
public class ChatController {
    
    private final ChatService chatService;
    
    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage, Authentication authentication) {
        return chatService.saveMessage(chatMessage, authentication);
    }
    
    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, Authentication authentication) {
        chatMessage.setMessageType(ChatMessage.MessageType.TEXT);
        return chatMessage;
    }
    
    @RestController
    @RequestMapping("/api/chat")
    @CrossOrigin(origins = "*", maxAge = 3600)
    public static class ChatRestController {
        
        private final ChatService chatService;
        
        public ChatRestController(ChatService chatService) {
            this.chatService = chatService;
        }
        
        @GetMapping("/messages")
        @Operation(summary = "Get chat messages", description = "Get recent chat messages")
        public ResponseEntity<List<ChatMessage>> getRecentMessages(@RequestParam(defaultValue = "50") int limit) {
            List<ChatMessage> messages = chatService.getRecentMessages(limit);
            return ResponseEntity.ok(messages);
        }
        
        @PostMapping("/messages")
        @Operation(summary = "Send message", description = "Send a chat message")
        public ResponseEntity<ChatMessage> sendMessage(@RequestBody ChatMessage message, Authentication authentication) {
            ChatMessage savedMessage = chatService.saveMessage(message, authentication);
            return ResponseEntity.ok(savedMessage);
        }
    }
}