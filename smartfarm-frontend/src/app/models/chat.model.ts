import { LoginResponse } from './user.model';

export interface ChatMessage {
  id?: number;
  sender: MessageUser;
  recipient?: MessageUser;
  content: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  isRead?: boolean;
  conversationId?: string;
}

export interface MessageUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  username?: string;
  token?: string;
  type?: string;
}

export interface MessageResponse {
  id: number;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender: MessageUser;
  recipient: MessageUser;
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE'
}