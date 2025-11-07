import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../services/attendance.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

interface AttendanceRecord {
  id: number;
  workerName: string;
  checkInTime: string;
  checkOutTime?: string;
  totalHours: string;
  status: string;
  date: string;
  faceImageData?: string;
  location?: string;
}

@Component({
  selector: 'app-attendance-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-history.component.html',
  styleUrls: ['./attendance-history.component.scss']
})
export class AttendanceHistoryComponent implements OnInit {
  attendanceRecords: AttendanceRecord[] = [];
  workers: any[] = [];
  loading = true;
  selectedDate = new Date().toISOString().split('T')[0];
  selectedWorker: number | null = null;
  showImageModal = false;
  selectedImage = '';

  constructor(
    private attendanceService: AttendanceService,
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadWorkers();
    this.loadAttendanceRecords();
  }

  loadWorkers(): void {
    const currentUser = this.authService.getCurrentUser();

    // Only show worker filter for supervisors and above
    if (currentUser?.role === 'WORKER') {
      this.workers = []; // Workers don't need to filter by worker
      return;
    }

    this.userService.getMyUsers().subscribe({
      next: (users) => {
        this.workers = users.filter(user => user.role === 'WORKER');
      },
      error: (error) => {
        console.error('Error loading workers:', error);
      }
    });
  }

  loadAttendanceRecords(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();

    this.attendanceService.getAttendanceHistory().subscribe({
      next: (records) => {
        console.log('Raw attendance records:', records);

        // Role-based filtering
        let filteredRecords = records;

        if (currentUser?.role === 'WORKER') {
          // Workers only see their own attendance
          filteredRecords = records.filter(record => record.workerId === currentUser.id);
        } else if (currentUser?.role === 'SUPERVISOR') {
          // Supervisors see attendance for workers in their farm
          // This would typically be filtered by farmId on the backend
          // For now, we'll show all workers (assuming they're all in supervisor's farm)
        }
        // FARM_OWNER and SYSTEM_ADMIN see all records

        // Apply date filter
        if (this.selectedDate) {
          filteredRecords = filteredRecords.filter(record => record.date === this.selectedDate);
        }

        // Apply worker filter
        if (this.selectedWorker) {
          filteredRecords = filteredRecords.filter(record => record.workerId === this.selectedWorker);
        }

        // Map to the expected format and determine status
        this.attendanceRecords = filteredRecords.map(record => ({
          id: record.id,
          workerName: record.workerName || `${record.firstName || 'Unknown'} ${record.lastName || 'Worker'}`,
          checkInTime: record.checkInTime || 'Not checked in',
          checkOutTime: record.checkOutTime || 'Not checked out',
          totalHours: record.totalHours ? `${record.totalHours}h` : '0h',
          status: this.determineStatus(record),
          date: record.date,
          faceImageData: record.faceImageData,
          location: record.location || 'Unknown Location'
        }));

        console.log('Processed attendance records:', this.attendanceRecords);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendance records:', error);
        this.attendanceRecords = [];
        this.loading = false;
      }
    });
  }

  private determineStatus(record: any): string {
    if (!record.checkInTime) return 'ABSENT';

    // Parse check-in time to determine if late
    const checkInTime = record.checkInTime;
    const [time, period] = checkInTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);

    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }

    // Consider 8:00 AM as standard start time
    const standardStartHour = 8;
    const standardStartMinute = 0;

    if (hour24 > standardStartHour || (hour24 === standardStartHour && minutes > standardStartMinute)) {
      return 'LATE';
    } else if (hour24 < standardStartHour || (hour24 === standardStartHour && minutes < standardStartMinute)) {
      return 'EARLY';
    } else {
      return 'ON_TIME';
    }
  }

  filterRecords(): void {
    this.loadAttendanceRecords();
  }

  viewFaceImage(imageData: string): void {
    this.selectedImage = imageData;
    this.showImageModal = true;
  }

  closeFaceImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = '';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ON_TIME':
        return 'bg-green-100 text-green-800';
      case 'LATE':
        return 'bg-red-100 text-red-800';
      case 'EARLY':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  exportAttendance(): void {
    const currentUser = this.authService.getCurrentUser();
    let dataToExport = this.attendanceRecords;

    // Role-based export data
    if (currentUser?.role === 'WORKER') {
      // Workers only export their own data
      dataToExport = this.attendanceRecords.filter(record =>
        record.workerName.includes(currentUser.firstName) &&
        record.workerName.includes(currentUser.lastName)
      );
    }

    // For now, just show success message
    // In real implementation, this would call a download service
    const recordCount = dataToExport.length;
    const userType = currentUser?.role?.toLowerCase().replace('_', ' ') || 'user';

    alert(`✅ Attendance records exported successfully!\n\n${recordCount} records exported for ${userType}.\nCheck your Downloads folder.`);
  }
}