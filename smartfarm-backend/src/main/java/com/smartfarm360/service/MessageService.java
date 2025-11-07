package com.smartfarm360.service;

import com.smartfarm360.model.Message;
import com.smartfarm360.model.User;
import com.smartfarm360.repository.MessageRepository;
import com.smartfarm360.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public Message sendMessage(String senderUsername, Long recipientId, String content, Message.MessageType messageType) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));
        
        // Validate if sender can message recipient based on hierarchy
        if (!canSendMessage(sender, recipient)) {
            throw new RuntimeException("You are not authorized to send messages to this user");
        }
        
        Message message = new Message();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(content);
        message.setMessageType(messageType);
        message.setIsRead(false);
        
        Message savedMessage = messageRepository.save(message);
        log.info("Message sent from {} to {}", sender.getUsername(), recipient.getUsername());
        
        return savedMessage;
    }
    
    public List<Message> getConversation(String username, Long otherUserId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Other user not found"));
        
        // Validate if user can view conversation with other user
        if (!canSendMessage(user, otherUser) && !canSendMessage(otherUser, user)) {
            throw new RuntimeException("You are not authorized to view this conversation");
        }
        
        return messageRepository.findConversationBetweenUsers(user.getId(), otherUserId);
    }
    
    public List<User> getAvailableContacts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<User> availableContacts = new ArrayList<>();
        
        switch (user.getRole()) {
            case WORKER:
                // Workers can only message their assigned supervisor
                if (user.getAssignedFarm() != null) {
                    List<User> supervisors = userRepository.findByAssignedFarmIdAndRole(
                            user.getAssignedFarm().getId(), User.Role.SUPERVISOR);
                    availableContacts.addAll(supervisors);
                }
                break;
                
            case SUPERVISOR:
                // Supervisors can message farm owners and their assigned workers
                if (user.getAssignedFarm() != null) {
                    // Get farm owner
                    if (user.getAssignedFarm().getOwner() != null) {
                        availableContacts.add(user.getAssignedFarm().getOwner());
                    }
                    
                    // Get assigned workers
                    List<User> workers = userRepository.findByAssignedFarmIdAndRole(
                            user.getAssignedFarm().getId(), User.Role.WORKER);
                    availableContacts.addAll(workers);
                }
                break;
                
            case FARM_OWNER:
                // Farm owners can message system admins and their supervisors
                List<User> systemAdmins = userRepository.findByRole(User.Role.SYSTEM_ADMIN);
                availableContacts.addAll(systemAdmins);
                
                // Get supervisors from owned farms
                for (com.smartfarm360.model.Farm ownedFarm : user.getOwnedFarms()) {
                    List<User> supervisors = userRepository.findByAssignedFarmIdAndRole(
                            ownedFarm.getId(), User.Role.SUPERVISOR);
                    availableContacts.addAll(supervisors);
                }
                break;
                
            case SYSTEM_ADMIN:
                // System admins can only message farm owners
                List<User> farmOwners = userRepository.findByRole(User.Role.FARM_OWNER);
                availableContacts.addAll(farmOwners);
                break;
        }
        
        // Remove duplicates and the user themselves
        return availableContacts.stream()
                .distinct()
                .filter(contact -> !contact.getId().equals(user.getId()))
                .collect(Collectors.toList());
    }
    
    public List<Message> getUserConversations(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return messageRepository.findLatestConversationsForUser(user.getId());
    }
    
    public Long getUnreadCount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return messageRepository.countUnreadMessagesForUser(user.getId());
    }
    
    @Transactional
    public void markConversationAsRead(String username, Long otherUserId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        messageRepository.markConversationAsRead(user.getId(), otherUserId);
    }
    
    private boolean canSendMessage(User sender, User recipient) {
        switch (sender.getRole()) {
            case WORKER:
                // Workers can only message supervisors in their farm
                return recipient.getRole() == User.Role.SUPERVISOR && 
                       sender.getAssignedFarm() != null && 
                       recipient.getAssignedFarm() != null &&
                       sender.getAssignedFarm().getId().equals(recipient.getAssignedFarm().getId());
                
            case SUPERVISOR:
                // Supervisors can message farm owners and workers in their farm
                if (recipient.getRole() == User.Role.FARM_OWNER) {
                    return sender.getAssignedFarm() != null && 
                           sender.getAssignedFarm().getOwner() != null &&
                           sender.getAssignedFarm().getOwner().getId().equals(recipient.getId());
                }
                if (recipient.getRole() == User.Role.WORKER) {
                    return sender.getAssignedFarm() != null && 
                           recipient.getAssignedFarm() != null &&
                           sender.getAssignedFarm().getId().equals(recipient.getAssignedFarm().getId());
                }
                return false;
                
            case FARM_OWNER:
                // Farm owners can message system admins and supervisors in their farms
                if (recipient.getRole() == User.Role.SYSTEM_ADMIN) {
                    return true;
                }
                if (recipient.getRole() == User.Role.SUPERVISOR) {
                    return sender.getOwnedFarms().stream()
                            .anyMatch(farm -> recipient.getAssignedFarm() != null && 
                                    farm.getId().equals(recipient.getAssignedFarm().getId()));
                }
                return false;
                
            case SYSTEM_ADMIN:
                // System admins can only message farm owners
                return recipient.getRole() == User.Role.FARM_OWNER;
                
            default:
                return false;
        }
    }
}