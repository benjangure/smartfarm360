import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Attendance {
  id: number;
  checkInTime: string;
  checkOutTime?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  checkInNotes?: string;
  checkOutNotes?: string;
  totalHours?: number;
  status: 'CHECKED_IN' | 'CHECKED_OUT';
}

export interface CheckInRequest {
  location?: string;
  notes?: string;
}

export interface CheckOutRequest {
  location?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  checkIn(notes?: string, location?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/attendance/check-in`, { notes, location });
  }

  checkOut(notes?: string, location?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/attendance/check-out`, { notes, location });
  }

  // Legacy method names for backward compatibility with mock data for testing
  clockIn(request: any): Observable<any> {
    // Mock successful check-in response for testing
    return new Observable(observer => {
      setTimeout(() => {
        const mockAttendance = {
          id: Date.now(),
          checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          checkOutTime: null,
          checkInLocation: `${request.latitude}, ${request.longitude}`,
          checkInNotes: request.notes || 'Clocked in via mobile app',
          totalHours: 0,
          status: 'CHECKED_IN',
          faceVerified: !!request.faceImageData,
          date: new Date().toISOString().split('T')[0],
          faceImageData: request.faceImageData || null
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('todayAttendance', JSON.stringify(mockAttendance));
        
        observer.next(mockAttendance);
        observer.complete();
      }, 1000); // Simulate network delay
    });
  }

  clockOut(request: any): Observable<any> {
    // Mock successful check-out response for testing
    return new Observable(observer => {
      setTimeout(() => {
        const storedAttendance = localStorage.getItem('todayAttendance');
        let attendance = storedAttendance ? JSON.parse(storedAttendance) : null;
        
        if (attendance) {
          attendance.checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          attendance.checkOutLocation = `${request.latitude}, ${request.longitude}`;
          attendance.checkOutNotes = request.notes || 'Clocked out via mobile app';
          attendance.status = 'CHECKED_OUT';
          
          // Calculate total hours (mock calculation)
          const checkIn = new Date(`2024-01-01 ${attendance.checkInTime}`);
          const checkOut = new Date(`2024-01-01 ${attendance.checkOutTime}`);
          const diffMs = checkOut.getTime() - checkIn.getTime();
          attendance.totalHours = Math.round(diffMs / (1000 * 60 * 60) * 100) / 100;
          
          // Store completed attendance record in history
          this.addToAttendanceHistory(attendance);
          
          localStorage.setItem('todayAttendance', JSON.stringify(attendance));
        } else {
          attendance = {
            id: Date.now(),
            checkInTime: '08:00',
            checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            checkOutLocation: `${request.latitude}, ${request.longitude}`,
            checkOutNotes: request.notes || 'Clocked out via mobile app',
            totalHours: 8,
            status: 'CHECKED_OUT',
            date: new Date().toISOString().split('T')[0]
          };
          this.addToAttendanceHistory(attendance);
        }
        
        observer.next(attendance);
        observer.complete();
      }, 1000);
    });
  }

  private addToAttendanceHistory(attendance: any): void {
    const history = this.getAttendanceHistoryFromStorage();
    
    // Add current user info
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const historyRecord = {
      ...attendance,
      workerName: `${currentUser.firstName || 'Unknown'} ${currentUser.lastName || 'User'}`,
      workerId: currentUser.id,
      location: attendance.checkInLocation || 'Unknown Location'
    };
    
    // Remove any existing record for today
    const today = new Date().toISOString().split('T')[0];
    const filteredHistory = history.filter(record => record.date !== today || record.workerId !== currentUser.id);
    
    // Add new record
    filteredHistory.push(historyRecord);
    
    localStorage.setItem('attendanceHistory', JSON.stringify(filteredHistory));
  }

  private getAttendanceHistoryFromStorage(): any[] {
    const stored = localStorage.getItem('attendanceHistory');
    return stored ? JSON.parse(stored) : [];
  }

  getAttendanceHistory(): Observable<any[]> {
    return new Observable(observer => {
      const history = this.getAttendanceHistoryFromStorage();
      observer.next(history);
      observer.complete();
    });
  }

  // Mock location service - in a real app, you'd use the Geolocation API
  getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  }

  getTodayAttendance(): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.API_URL}/attendance/today`);
  }

  getAllAttendance(): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.API_URL}/attendance`);
  }

  getAttendanceByDateRange(startDate: string, endDate: string): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.API_URL}/attendance/range`, {
      params: { startDate, endDate }
    });
  }
}