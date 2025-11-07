import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-message-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatModalComponent],
  templateUrl: './message-notifications.component.html',
  styleUrls: ['./message-notifications.component.scss']
})
export class MessageNotificationsComponent implements OnInit, OnDestroy {
  conversations: any[] = [];
  unreadCount = 0;
  showNotifications = false;
  showChatModal = false;
  selectedConversation: any = null;
  currentUser: any;
  private subscription: Subscription = new Subscription();

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadConversations();
    this.subscribeToNewMessages();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadConversations() {
    if (this.currentUser) {
      // Use the new Observable methods
      this.subscription.add(
        this.chatService.getAllConversations().subscribe({
          next: (messages) => {
            this.processConversations(messages);
          },
          error: (error) => {
            console.error('Error loading conversations:', error);
          }
        })
      );
      
      this.subscription.add(
        this.chatService.getUnreadCount().subscribe({
          next: (count) => {
            this.unreadCount = count;
          },
          error: (error) => {
            console.error('Error loading unread count:', error);
          }
        })
      );
    }
  }

  private processConversations(messages: any[]) {
    // Group messages by conversation partner
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const partnerId = message.sender.id === this.currentUser.id 
        ? message.recipient.id 
        : message.sender.id;
      
      const partner = message.sender.id === this.currentUser.id 
        ? message.recipient 
        : message.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          participant: partner,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: 0
        });
      }
    });
    
    this.conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime())
      .slice(0, 5); // Show only recent 5 conversations in notifications
  }

  subscribeToNewMessages() {
    this.subscription.add(
      this.chatService.getMessages().subscribe(() => {
        this.loadConversations();
      })
    );
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  openChat(conversation: any) {
    this.selectedConversation = conversation;
    this.showChatModal = true;
    this.showNotifications = false;
    
    // Mark messages as read using the new method
    if (conversation.participant?.id) {
      this.chatService.markConversationAsRead(conversation.participant.id).subscribe({
        next: () => {
          this.loadConversations();
        },
        error: (error) => {
          console.error('Error marking conversation as read:', error);
        }
      });
    }
  }

  closeChatModal() {
    this.showChatModal = false;
    this.selectedConversation = null;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'text-red-600';
      case 'FARM_OWNER': return 'text-purple-600';
      case 'SUPERVISOR': return 'text-blue-600';
      case 'WORKER': return 'text-green-600';
      default: return 'text-gray-600';
    }
  }
}