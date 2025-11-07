import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatModalComponent],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss']
})
export class ConversationsComponent implements OnInit {
  conversations: any[] = [];
  currentUser: any;
  loading = true;
  showChatModal = false;
  selectedConversation: any = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadConversations();
    
    // Subscribe to new messages
    this.chatService.getMessages().subscribe({
      next: (message) => {
        this.loadConversations(); // Refresh conversations when new message arrives
      }
    });
  }

  loadConversations(): void {
    this.loading = true;
    
    if (this.currentUser) {
      this.conversations = this.chatService.getUserConversations(this.currentUser.id);
    }
    
    this.loading = false;
  }

  openConversation(conversation: any): void {
    this.selectedConversation = conversation;
    this.showChatModal = true;
    
    // Mark messages as read using the new method
    if (conversation.participant?.id) {
      this.chatService.markConversationAsRead(conversation.participant.id).subscribe({
        next: () => {
          this.loadConversations(); // Refresh to update unread counts
        },
        error: (error) => {
          console.error('Error marking conversation as read:', error);
        }
      });
    }
  }

  closeChatModal(): void {
    this.showChatModal = false;
    this.selectedConversation = null;
    this.loadConversations(); // Refresh conversations
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  getRoleIcon(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'fas fa-crown';
      case 'FARM_OWNER': return 'fas fa-user-tie';
      case 'SUPERVISOR': return 'fas fa-user-check';
      case 'WORKER': return 'fas fa-hard-hat';
      default: return 'fas fa-user';
    }
  }
}