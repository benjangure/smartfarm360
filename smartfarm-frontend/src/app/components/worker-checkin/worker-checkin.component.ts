import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-worker-checkin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-checkin.component.html',
  styleUrls: ['./worker-checkin.component.scss']
})
export class WorkerCheckinComponent implements OnInit {
  isCheckedIn = false;
  checkInTime: string | null = null;
  checkOutTime: string | null = null;
  currentTime = new Date();
  loading = false;
  error = '';
  success = '';
  notes = '';

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadTodayAttendance();
    
    // Update time every second
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  loadTodayAttendance() {
    this.loading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (attendance) => {
        if (attendance) {
          this.isCheckedIn = !!attendance.checkInTime && !attendance.checkOutTime;
          this.checkInTime = attendance.checkInTime;
          this.checkOutTime = attendance.checkOutTime || null;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.loading = false;
      }
    });
  }

  checkIn() {
    if (this.isCheckedIn) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.attendanceService.checkIn(this.notes).subscribe({
      next: (response) => {
        this.isCheckedIn = true;
        this.checkInTime = new Date().toISOString();
        this.success = 'Successfully checked in!';
        this.notes = '';
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to check in. Please try again.';
        this.loading = false;
        console.error('Check-in error:', error);
      }
    });
  }

  checkOut() {
    if (!this.isCheckedIn) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.attendanceService.checkOut(this.notes).subscribe({
      next: (response) => {
        this.isCheckedIn = false;
        this.checkOutTime = new Date().toISOString();
        this.success = 'Successfully checked out!';
        this.notes = '';
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to check out. Please try again.';
        this.loading = false;
        console.error('Check-out error:', error);
      }
    });
  }

  getWorkingHours(): string {
    if (this.checkInTime && !this.checkOutTime) {
      const checkIn = new Date(this.checkInTime);
      const now = new Date();
      const diff = now.getTime() - checkIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } else if (this.checkInTime && this.checkOutTime) {
      const checkIn = new Date(this.checkInTime);
      const checkOut = new Date(this.checkOutTime);
      const diff = checkOut.getTime() - checkIn.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return '0h 0m';
  }

  formatTime(timeString: string | null): string {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}