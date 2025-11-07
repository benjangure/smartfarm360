import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatModalComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss']
})
export class MessagesComponent implements OnInit, OnDestroy {
  conversations: any[] = [];
  availableContacts: any[] = [];
  selectedConversation: any = null;
  showChatModal = false;
  showNewChatModal = false;
  currentUser: any;
  loading = true;
  private subscription: Subscription = new Subscription();

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadConversations();
    this.loadAvailableContacts();
    this.subscribeToNewMessages();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadConversations() {
    this.loading = true;
    this.subscription.add(
      this.chatService.getAllConversations().subscribe({
        next: (messages) => {
          this.processConversations(messages);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading conversations:', error);
          this.loading = false;
        }
      })
    );
  }

  loadAvailableContacts() {
    this.subscription.add(
      this.chatService.getAvailableContacts().subscribe({
        next: (contacts) => {
          this.availableContacts = contacts;
        },
        error: (error) => {
          console.error('Error loading contacts:', error);
        }
      })
    );
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
          unreadCount: 0,
          messages: []
        });
      }
    });
    
    this.conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }

  subscribeToNewMessages() {
    this.subscription.add(
      this.chatService.getMessages().subscribe(() => {
        this.loadConversations();
      })
    );
  }

  openChat(conversation: any) {
    this.selectedConversation = conversation;
    this.showChatModal = true;
    
    // Mark messages as read
    this.chatService.markConversationAsRead(conversation.participant.id).subscribe({
      next: () => {
        this.loadConversations();
      },
      error: (error) => {
        console.error('Error marking conversation as read:', error);
      }
    });
  }

  openNewChat(contact: any) {
    this.selectedConversation = {
      participant: contact,
      messages: []
    };
    this.showChatModal = true;
    this.showNewChatModal = false;
  }

  closeChatModal() {
    this.showChatModal = false;
    this.selectedConversation = null;
  }

  openNewChatModal() {
    this.showNewChatModal = true;
  }

  closeNewChatModal() {
    this.showNewChatModal = false;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'text-red-600 bg-red-100';
      case 'FARM_OWNER': return 'text-purple-600 bg-purple-100';
      case 'SUPERVISOR': return 'text-blue-600 bg-blue-100';
      case 'WORKER': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'fas fa-crown';
      case 'FARM_OWNER': return 'fas fa-home';
      case 'SUPERVISOR': return 'fas fa-user-tie';
      case 'WORKER': return 'fas fa-hard-hat';
      default: return 'fas fa-user';
    }
  }
}