import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, MessageType } from '../../models/chat.model';
import { LoginResponse, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-modal.component.html',
  styleUrls: ['./chat-modal.component.scss']
})
export class ChatModalComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @Input() isOpen = false;
  @Input() recipientName = 'Chat';
  @Input() recipientId?: number;
  @Output() closeModal = new EventEmitter<void>();
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUser: LoginResponse | null = null;
  isConnected: boolean = false;
  loading = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.isOpen) {
      this.initializeChat();
    }
  }

  ngOnDestroy() {
    // Don't disconnect the service as it might be used elsewhere
  }

  ngOnChanges() {
    if (this.isOpen && !this.isConnected) {
      this.initializeChat();
    }
  }

  initializeChat() {
    this.loading = true;
    this.chatService.connect().subscribe({
      next: (connected) => {
        this.isConnected = connected;
        if (connected) {
          this.subscribeToMessages();
          this.loadChatHistory();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Chat connection error:', error);
        this.isConnected = false;
        this.loading = false;
      }
    });
  }

  subscribeToMessages() {
    this.chatService.getMessages().subscribe({
      next: (message) => {
        // Only add message if it's part of current conversation and not already in messages
        const isRelevantMessage = this.recipientId ? 
          (message.sender.id === this.currentUser?.id && message.recipient?.id === this.recipientId) ||
          (message.sender.id === this.recipientId && message.recipient?.id === this.currentUser?.id) :
          message.sender.id === this.currentUser?.id || message.recipient?.id === this.currentUser?.id;
          
        const messageExists = this.messages.some(m => m.id === message.id);
        
        if (isRelevantMessage && !messageExists) {
          this.messages.push(message);
          this.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setTimeout(() => this.scrollToBottom(), 100);
        }
      },
      error: (error) => {
        console.error('Error receiving message:', error);
      }
    });
  }

  loadChatHistory() {
    if (this.recipientId) {
      this.chatService.getConversation(this.recipientId).subscribe({
        next: (messages) => {
          this.messages = this.convertToLegacyFormat(messages);
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Error loading chat history:', error);
        }
      });
    }
  }

  private convertToLegacyFormat(messages: any[]): ChatMessage[] {
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: {
        id: msg.sender.id,
        firstName: msg.sender.firstName,
        lastName: msg.sender.lastName,
        role: msg.sender.role,
        email: msg.sender.email,
        username: msg.sender.email, // Use email as username fallback
        token: '', // Not needed for display
        type: 'Bearer' // Default type
      },
      recipient: {
        id: msg.recipient.id,
        firstName: msg.recipient.firstName,
        lastName: msg.recipient.lastName,
        role: msg.recipient.role,
        email: msg.recipient.email,
        username: msg.recipient.email, // Use email as username fallback
        token: '', // Not needed for display
        type: 'Bearer' // Default type
      },
      createdAt: msg.createdAt,
      messageType: msg.messageType as MessageType
    }));
  }

  sendMessage() {
    if (this.newMessage.trim() && this.recipientId && this.currentUser) {
      this.chatService.sendMessage(this.recipientId, this.newMessage.trim()).subscribe({
        next: (response) => {
          // Add the new message to the local array
          const newMessage = this.convertToLegacyFormat([response])[0];
          this.messages.push(newMessage);
          this.newMessage = '';
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Error sending message:', error);
          alert('Failed to send message. Please try again.');
        }
      });
    }
  }

  private getRecipient(): any {
    if (this.recipientId) {
      // Return specific recipient object for direct messaging
      return {
        id: this.recipientId,
        firstName: this.recipientName.split(' ')[0] || 'Unknown',
        lastName: this.recipientName.split(' ')[1] || 'User',
        role: 'WORKER', // This would be determined from the actual user data
        email: `user${this.recipientId}@smartfarm360.com`
      };
    }
    return this.getRecipientByRole(this.currentUser?.role || 'WORKER');
  }

  private getRecipientByRole(senderRole: string | UserRole): any {
    // Define recipients based on role hierarchy
    switch (senderRole) {
      case 'WORKER':
        return {
          id: 888,
          firstName: 'Farm',
          lastName: 'Supervisor',
          role: 'SUPERVISOR',
          email: 'supervisor@smartfarm360.com'
        };
      case 'SUPERVISOR':
        return {
          id: 777,
          firstName: 'Farm',
          lastName: 'Owner',
          role: 'FARM_OWNER',
          email: 'owner@smartfarm360.com'
        };
      case 'FARM_OWNER':
        return {
          id: 666,
          firstName: 'System',
          lastName: 'Admin',
          role: 'SYSTEM_ADMIN',
          email: 'admin@smartfarm360.com'
        };
      default:
        return {
          id: 999,
          firstName: 'Support',
          lastName: 'Team',
          role: 'SYSTEM_ADMIN',
          email: 'support@smartfarm360.com'
        };
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  scrollToBottom() {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  isMyMessage(message: ChatMessage): boolean {
    return message.sender.id === this.currentUser?.id;
  }

  formatTime(timestamp: string | Date): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  close() {
    this.closeModal.emit();
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