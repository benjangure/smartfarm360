import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';
import { FaceScanService, FaceScanResult } from '../../services/face-scan.service';
import { DownloadService } from '../../services/download.service';
import { Attendance } from '../../models/attendance.model';
import { LoginResponse } from '../../models/user.model';
import { FaceScanModalComponent } from '../face-scan-modal/face-scan-modal.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FaceScanModalComponent],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit {
  currentUser: LoginResponse | null = null;
  todayAttendance: any = null;
  attendanceHistory: any[] = [];
  loading = false;
  clockingIn = false;
  clockingOut = false;
  isCheckedIn = false;
  locationStatus: 'granted' | 'denied' | 'pending' = 'pending';
  currentTime = new Date();
  showFaceScanModal = false;
  faceScanEnabled = true;
  pendingCheckInData: any = null;
  pendingCheckOutData: any = null;



  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private faceScanService: FaceScanService,
    private downloadService: DownloadService
  ) {
    // Update current time every second
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.checkLocationPermission();
    this.loadMockData();
  }

  checkLocationPermission(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.locationStatus = 'granted';
        },
        (error) => {
          this.locationStatus = 'denied';
        }
      );
    } else {
      this.locationStatus = 'denied';
    }
  }

  loadMockData(): void {
    // Load existing attendance data from localStorage
    const storedAttendance = localStorage.getItem('todayAttendance');
    if (storedAttendance) {
      this.todayAttendance = JSON.parse(storedAttendance);
      this.isCheckedIn = this.todayAttendance.status === 'CHECKED_IN';
    } else {
      // Initialize with empty data
      this.todayAttendance = {
        checkInTime: null,
        checkOutTime: null,
        totalHours: '0:00'
      };
    }

    this.attendanceHistory = [];

    // TODO: Load real attendance data from API
    // this.attendanceService.getAttendanceHistory().subscribe(history => {
    //   this.attendanceHistory = history;
    // });
  }

  toggleAttendance(): void {
    if (this.locationStatus !== 'granted') {
      alert('Please enable location access to use attendance tracking.');
      return;
    }

    this.loading = true;

    // Simulate API call
    setTimeout(() => {
      if (this.isCheckedIn) {
        // Check out
        this.todayAttendance.checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.todayAttendance.totalHours = this.getWorkingHours();
        this.isCheckedIn = false;
      } else {
        // Check in
        this.todayAttendance.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.isCheckedIn = true;
      }
      this.loading = false;
    }, 2000);
  }

  async clockIn(): Promise<void> {
    this.clockingIn = true;

    try {
      const position = await this.attendanceService.getCurrentLocation();
      const checkInData = {
        latitude: position.latitude,
        longitude: position.longitude,
        notes: 'Clocked in via mobile app'
      };

      // Check if face scan is enabled and available
      if (this.faceScanEnabled && await this.faceScanService.isCameraAvailable()) {
        // Store check-in data and show face scan modal
        this.pendingCheckInData = checkInData;
        this.showFaceScanModal = true;
        this.clockingIn = false;
      } else {
        // Proceed with normal check-in
        this.performCheckIn(checkInData);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      this.clockingIn = false;
      alert('Failed to get location. Please enable location services and try again.');
    }
  }

  private performCheckIn(checkInData: any, faceData?: string): void {
    const request = {
      ...checkInData,
      faceImageData: faceData // Include face data if available
    };

    this.attendanceService.clockIn(request).subscribe({
      next: (attendance) => {
        console.log('Check-in successful:', attendance);
        this.todayAttendance = attendance;
        this.isCheckedIn = true;
        this.clockingIn = false;
        
        const message = faceData ? 
          '✅ Check-in successful! Photo captured.' : 
          '✅ Check-in successful!';
        alert(message);
      },
      error: (error) => {
        console.error('Error clocking in:', error);
        this.clockingIn = false;
        alert('Failed to check in. Please try again.');
      }
    });
  }

  async clockOut(): Promise<void> {
    this.clockingOut = true;

    try {
      const position = await this.attendanceService.getCurrentLocation();
      const checkOutData = {
        latitude: position.latitude,
        longitude: position.longitude,
        notes: 'Clocked out via mobile app'
      };

      // Check if face scan is enabled and available for check-out
      if (this.faceScanEnabled && await this.faceScanService.isCameraAvailable()) {
        // Store check-out data and show face scan modal
        this.pendingCheckOutData = checkOutData;
        this.showFaceScanModal = true;
        this.clockingOut = false;
      } else {
        // Proceed with normal check-out
        this.performCheckOut(checkOutData);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      this.clockingOut = false;
      alert('Failed to get location. Please enable location services and try again.');
    }
  }

  private performCheckOut(checkOutData: any, faceData?: string): void {
    const request = {
      ...checkOutData,
      faceImageData: faceData // Include face data if available
    };

    this.attendanceService.clockOut(request).subscribe({
      next: (attendance) => {
        console.log('Check-out successful:', attendance);
        this.todayAttendance = attendance;
        this.isCheckedIn = false;
        this.clockingOut = false;
        
        const message = faceData ? 
          '✅ Check-out successful! Face verification completed.' : 
          '✅ Check-out successful!';
        alert(message);
      },
      error: (error) => {
        console.error('Error clocking out:', error);
        this.clockingOut = false;
        alert('Failed to check out. Please try again.');
      }
    });
  }

  canClockIn(): boolean {
    return !this.todayAttendance?.clockInTime;
  }

  canClockOut(): boolean {
    return !!this.todayAttendance?.clockInTime && !this.todayAttendance?.clockOutTime;
  }

  getWorkingHours(): string {
    if (!this.todayAttendance?.checkInTime) return '0:00';

    const now = new Date();
    const checkInTime = this.parseTimeString(this.todayAttendance.checkInTime);

    if (this.todayAttendance.checkOutTime) {
      // If checked out, calculate total time between check in and check out
      const checkOutTime = this.parseTimeString(this.todayAttendance.checkOutTime);
      return this.calculateTimeDifference(checkInTime, checkOutTime);
    } else {
      // If still checked in, calculate time from check in to now
      return this.calculateTimeDifference(checkInTime, now);
    }
  }

  private parseTimeString(timeStr: string): Date {
    const today = new Date();
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }

    today.setHours(hour24, minutes, 0, 0);
    return today;
  }

  private calculateTimeDifference(startTime: Date, endTime: Date): string {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'On Time':
        return 'bg-green-100 text-green-800';
      case 'Late':
        return 'bg-red-100 text-red-800';
      case 'Early Departure':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Face scan event handlers
  onFaceScanComplete(result: FaceScanResult): void {
    this.showFaceScanModal = false;

    if (result.success) {
      // Face verification successful
      if (this.pendingCheckInData) {
        this.performCheckIn(this.pendingCheckInData, result.imageData);
      } else if (this.pendingCheckOutData) {
        this.performCheckOut(this.pendingCheckOutData, result.imageData);
      }
    } else {
      // Face verification failed
      const action = this.pendingCheckInData ? 'check in' : 'check out';
      const retry = confirm(
        `Face verification failed: ${result.message}\n\nWould you like to:\n` +
        `• Click OK to try face scan again\n` +
        `• Click Cancel to ${action} without face verification`
      );

      if (retry) {
        // Retry face scan
        this.showFaceScanModal = true;
      } else {
        // Proceed without face verification
        if (this.pendingCheckInData) {
          this.performCheckIn(this.pendingCheckInData);
        } else if (this.pendingCheckOutData) {
          this.performCheckOut(this.pendingCheckOutData);
        }
      }
    }

    this.pendingCheckInData = null;
    this.pendingCheckOutData = null;
  }

  onFaceScanCancel(): void {
    this.showFaceScanModal = false;

    if (this.pendingCheckInData) {
      const proceed = confirm(
        'Face scan cancelled.\n\nWould you like to check in without face verification?'
      );

      if (proceed) {
        this.performCheckIn(this.pendingCheckInData);
      }
      this.clockingIn = false;
    } else if (this.pendingCheckOutData) {
      const proceed = confirm(
        'Face scan cancelled.\n\nWould you like to check out without face verification?'
      );

      if (proceed) {
        this.performCheckOut(this.pendingCheckOutData);
      }
      this.clockingOut = false;
    }

    this.pendingCheckInData = null;
    this.pendingCheckOutData = null;
  }

  toggleFaceScan(): void {
    this.faceScanEnabled = !this.faceScanEnabled;
    const status = this.faceScanEnabled ? 'enabled' : 'disabled';
    alert(`Face scan ${status} for check-in.`);
  }

  exportAttendance(): void {
    // Generate attendance data for export
    const attendanceData = [
      {
        date: new Date().toISOString().split('T')[0],
        workerName: `${this.currentUser?.firstName} ${this.currentUser?.lastName}`,
        checkInTime: this.todayAttendance?.checkInTime || 'Not checked in',
        checkOutTime: this.todayAttendance?.checkOutTime || 'Not checked out',
        totalHours: this.todayAttendance?.totalHours || '0:00',
        status: this.todayAttendance?.checkInTime ? 'PRESENT' : 'ABSENT',
        location: 'Farm Location'
      },
      ...this.attendanceHistory.map(record => ({
        date: new Date(record.date).toISOString().split('T')[0],
        workerName: `${this.currentUser?.firstName} ${this.currentUser?.lastName}`,
        checkInTime: new Date(record.checkIn).toLocaleTimeString(),
        checkOutTime: new Date(record.checkOut).toLocaleTimeString(),
        totalHours: record.totalHours,
        status: record.status,
        location: 'Farm Location'
      }))
    ];

    // Ask user for format preference
    const format = confirm('Choose format:\nOK for PDF\nCancel for Excel') ? 'pdf' : 'excel';

    this.downloadService.generateAttendanceReport(attendanceData, format);

    alert(`✅ Attendance report downloaded as ${format.toUpperCase()}\n\nCheck your Downloads folder.`);
  }

  // Method to reset attendance for testing
  resetAttendance(): void {
    const confirm = window.confirm('Reset today\'s attendance data? This will clear check-in/out records.');
    if (confirm) {
      localStorage.removeItem('todayAttendance');
      this.loadMockData();
      alert('✅ Attendance data reset successfully!');
    }
  }
}
