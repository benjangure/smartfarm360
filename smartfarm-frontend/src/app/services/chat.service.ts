import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { ChatMessage } from '../models/chat.model';
import { environment } from '../../environments/environment';

interface MessageRequest {
  recipientId: number;
  content: string;
  messageType?: string;
}

interface MessageResponse {
  id: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender: UserSummary;
  recipient: UserSummary;
}

interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messageSubject = new Subject<ChatMessage>();
  private connectionSubject = new BehaviorSubject<boolean>(true);
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  connect(): Observable<boolean> {
    this.connectionSubject.next(true);
    return of(true);
  }

  disconnect(): void {
    this.connectionSubject.next(false);
  }

  sendMessage(recipientId: number, content: string): Observable<MessageResponse> {
    const request: MessageRequest = {
      recipientId,
      content,
      messageType: 'TEXT'
    };
    
    return this.http.post<MessageResponse>(`${this.API_URL}/messages/send`, request);
  }

  getAvailableContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.API_URL}/messages/contacts`);
  }

  getConversation(otherUserId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.API_URL}/messages/conversation/${otherUserId}`);
  }

  getAllConversations(): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.API_URL}/messages/conversations`);
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.API_URL}/messages/unread-count`);
  }

  markConversationAsRead(otherUserId: number): Observable<string> {
    return this.http.post<string>(`${this.API_URL}/messages/mark-read/${otherUserId}`, {});
  }

  getMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  isConnected(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  getChatHistory(recipientId?: number): Observable<MessageResponse[]> {
    if (recipientId) {
      return this.getConversation(recipientId);
    } else {
      return this.getAllConversations();
    }
  }

  // Legacy methods for backward compatibility
  getUserConversations(userId?: number): any[] {
    // This method is now handled by the backend
    // Return empty array and let components use the new Observable methods
    return [];
  }

  markMessagesAsRead(conversationId: string, userId: number): void {
    // This is now handled by markConversationAsRead
    console.warn('markMessagesAsRead is deprecated, use markConversationAsRead instead');
  }
}