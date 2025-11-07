import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, MessageType } from '../../models/chat.model';
import { User, LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  currentUser: LoginResponse | null = null;
  isConnected: boolean = false;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.connectToChat();
    this.loadChatHistory();
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }

  connectToChat() {
    this.chatService.connect().subscribe({
      next: (connected) => {
        this.isConnected = connected;
        if (connected) {
          this.subscribeToMessages();
        }
      },
      error: (error) => {
        console.error('Chat connection error:', error);
        this.isConnected = false;
      }
    });
  }

  subscribeToMessages() {
    this.chatService.getMessages().subscribe({
      next: (message) => {
        this.messages.push(message);
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error receiving message:', error);
      }
    });
  }

  loadChatHistory() {
    this.chatService.getChatHistory().subscribe({
      next: (messages) => {
        this.messages = this.convertToLegacyFormat(messages);
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading chat history:', error);
      }
    });
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
        username: msg.sender.email,
        token: '',
        type: 'Bearer'
      },
      recipient: {
        id: msg.recipient.id,
        firstName: msg.recipient.firstName,
        lastName: msg.recipient.lastName,
        role: msg.recipient.role,
        email: msg.recipient.email,
        username: msg.recipient.email,
        token: '',
        type: 'Bearer'
      },
      createdAt: msg.createdAt,
      messageType: msg.messageType as MessageType
    }));
  }

  sendMessage() {
    if (this.newMessage.trim() && this.isConnected && this.currentUser) {
      // For now, we'll need a default recipient ID - this should be updated based on the chat context
      const defaultRecipientId = 1; // This should be determined by the chat context
      
      this.chatService.sendMessage(defaultRecipientId, this.newMessage.trim()).subscribe({
        next: (response) => {
          const newMessage = this.convertToLegacyFormat([response])[0];
          this.messages.push(newMessage);
          this.newMessage = '';
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      });
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
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
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
      case 'SUPERVISOR': return 'fas fa-user-tie';
      case 'WORKER': return 'fas fa-user';
      default: return 'fas fa-user';
    }
  }
}