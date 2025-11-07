import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationConfig {
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    fromEmail: string;
  };
  smsSettings: {
    provider: 'twilio' | 'aws-sns';
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
  };
}

export interface NotificationRequest {
  type: 'email' | 'sms' | 'both';
  recipients: string[];
  subject?: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'attendance' | 'task' | 'alert' | 'report';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8080/api/notifications';

  constructor(private http: HttpClient) {}

  // Send notification
  sendNotification(request: NotificationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, request);
  }

  // Send attendance notification
  sendAttendanceNotification(userId: number, type: 'check-in' | 'check-out', location: string): Observable<any> {
    const request: NotificationRequest = {
      type: 'both',
      recipients: ['supervisor@smartfarm.com'], // Get from user's supervisor
      subject: `Worker ${type} notification`,
      message: `Worker has ${type.replace('-', ' ')} at ${location} at ${new Date().toLocaleString()}`,
      priority: 'medium',
      category: 'attendance'
    };
    return this.sendNotification(request);
  }

  // Send task notification
  sendTaskNotification(taskId: number, action: 'assigned' | 'completed' | 'overdue'): Observable<any> {
    const request: NotificationRequest = {
      type: 'both',
      recipients: [], // Will be populated based on task assignment
      subject: `Task ${action}`,
      message: `Task #${taskId} has been ${action}`,
      priority: action === 'overdue' ? 'high' : 'medium',
      category: 'task'
    };
    return this.sendNotification(request);
  }

  // Get notification settings
  getNotificationConfig(): Observable<NotificationConfig> {
    return this.http.get<NotificationConfig>(`${this.apiUrl}/config`);
  }

  // Update notification settings
  updateNotificationConfig(config: NotificationConfig): Observable<NotificationConfig> {
    return this.http.put<NotificationConfig>(`${this.apiUrl}/config`, config);
  }

  // Get notification history
  getNotificationHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history`);
  }
}