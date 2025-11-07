import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DownloadService } from '../../services/download.service';
import { AuthService } from '../../services/auth.service';
import { FarmService } from '../../services/farm.service';
import { UserService } from '../../services/user.service';
import { TaskService } from '../../services/task.service';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  farms: any[] = [];
  selectedFarm: number | null = null;
  startDate: string = '';
  endDate: string = '';
  isGenerating: boolean = false;
  currentUserRole: string = '';

  reportTypes = [
    { id: 'attendance', name: 'Attendance Report', icon: 'fas fa-clock' },
    { id: 'tasks', name: 'Task Completion Report', icon: 'fas fa-tasks' },
    { id: 'farm-summary', name: 'Farm Summary Report', icon: 'fas fa-chart-bar' }
  ];

  recentReports = [
    {
      name: 'Weekly Attendance Summary',
      description: 'Oct 22-28, 2024 attendance data',
      date: new Date(Date.now() - 86400000),
      size: '2.4 MB',
      icon: 'fas fa-clock text-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      name: 'Monthly Task Report',
      description: 'October 2024 task completion',
      date: new Date(Date.now() - 2 * 86400000),
      size: '1.8 MB',
      icon: 'fas fa-tasks text-green-600',
      iconBg: 'bg-green-100'
    },
    {
      name: 'Farm Operations Summary',
      description: 'Q3 2024 comprehensive report',
      date: new Date(Date.now() - 7 * 86400000),
      size: '5.2 MB',
      icon: 'fas fa-seedling text-yellow-600',
      iconBg: 'bg-yellow-100'
    }
  ];

  constructor(
    private downloadService: DownloadService,
    private authService: AuthService,
    private farmService: FarmService,
    private userService: UserService,
    private taskService: TaskService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit() {
    this.currentUserRole = this.authService.getCurrentUser()?.role || '';
    this.loadFarms();
    this.setDefaultDates();
  }

  loadFarms() {
    this.farmService.getMyFarms().subscribe({
      next: (farms) => {
        this.farms = farms;
      },
      error: (error) => {
        console.error('Error loading farms:', error);
      }
    });
  }

  setDefaultDates() {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    this.endDate = today.toISOString().split('T')[0];
    this.startDate = lastMonth.toISOString().split('T')[0];
  }

  getSelectedFarmName(): string {
    const farm = this.farms.find(f => f.id === this.selectedFarm);
    return farm?.name || '';
  }

  generateReport(reportType: string, format: 'pdf' | 'excel') {
    if (this.isGenerating) return;

    this.isGenerating = true;

    switch (reportType) {
      case 'attendance':
        this.generateAttendanceReport(format);
        break;
      
      case 'tasks':
        this.generateTaskReport(format);
        break;
      
      case 'farm-summary':
        if (!this.selectedFarm) {
          alert('Please select a farm for the summary report');
          this.isGenerating = false;
          return;
        }
        this.generateFarmSummaryReport(format);
        break;
      
      default:
        this.isGenerating = false;
        return;
    }
  }

  private generateAttendanceReport(format: 'pdf' | 'excel') {
    console.log('Generating attendance report for role:', this.currentUserRole);
    
    // Try to get real attendance data
    this.attendanceService.getAttendanceHistory().subscribe({
      next: (attendanceData) => {
        console.log('Attendance data loaded for report:', attendanceData);
        
        if (attendanceData.length === 0) {
          alert('No attendance records found. Generating sample report for demonstration.');
          // Use mock data if no real attendance
          const mockAttendance = [
            {
              date: '2024-11-01',
              workerName: 'Sample Worker',
              checkInTime: '08:00',
              checkOutTime: '17:00',
              totalHours: '9.0',
              status: 'ON_TIME',
              location: 'Farm Gate'
            },
            {
              date: '2024-11-02',
              workerName: 'Sample Worker',
              checkInTime: '08:15',
              checkOutTime: '17:15',
              totalHours: '9.0',
              status: 'LATE',
              location: 'Farm Gate'
            }
          ];
          this.downloadService.generateAttendanceReport(mockAttendance, format);
        } else {
          // Format the real attendance data
          const formattedAttendance = attendanceData.map(record => ({
            date: record.date ? new Date(record.date).toLocaleDateString() : 'Unknown',
            workerName: record.user ? `${record.user.firstName} ${record.user.lastName}` : 'Unknown Worker',
            checkInTime: record.checkInTime || 'Not recorded',
            checkOutTime: record.checkOutTime || 'Not recorded',
            totalHours: record.totalHours || 'Not calculated',
            status: record.status || 'Unknown',
            location: record.location || 'Not specified'
          }));
          this.downloadService.generateAttendanceReport(formattedAttendance, format);
        }
        this.isGenerating = false;
        this.showSuccessMessage(`Attendance report downloaded successfully as ${format.toUpperCase()}`);
      },
      error: (error) => {
        console.error('Error loading attendance data:', error);
        alert('Error loading attendance data. Generating sample report instead.');
        
        // Use mock data on error
        const mockAttendance = [
          {
            date: '2024-11-01',
            workerName: 'Sample Worker - Error Loading Real Data',
            checkInTime: '08:00',
            checkOutTime: '17:00',
            totalHours: '9.0',
            status: 'ON_TIME',
            location: 'Farm Gate'
          }
        ];
        this.downloadService.generateAttendanceReport(mockAttendance, format);
        this.isGenerating = false;
        this.showSuccessMessage(`Attendance report downloaded successfully as ${format.toUpperCase()} (using sample data due to error)`);
      }
    });
  }

  private generateTaskReport(format: 'pdf' | 'excel') {
    console.log('Generating task report for role:', this.currentUserRole);
    
    // For workers, get their assigned tasks; for supervisors/admins, get all tasks
    const taskObservable = this.currentUserRole === 'WORKER' 
      ? this.taskService.getMyTasks() 
      : this.taskService.getAllTasks();

    taskObservable.subscribe({
      next: (tasks) => {
        console.log('Tasks loaded for report:', tasks);
        
        if (tasks.length === 0) {
          alert('No tasks found. Generating sample report for demonstration.');
          // Use mock data if no real tasks
          const mockTasks = [
            {
              id: 1,
              title: 'Sample Task - No Real Data',
              description: 'This is a sample task for demonstration purposes',
              status: 'PENDING',
              priority: 'MEDIUM',
              assignedTo: { firstName: 'Sample', lastName: 'Worker' },
              createdBy: { firstName: 'Sample', lastName: 'Supervisor' },
              dueDate: '2024-11-15',
              createdAt: '2024-11-01'
            }
          ];
          this.downloadService.generateTaskReport(mockTasks, format);
        } else {
          // Format the real tasks data for the report
          const formattedTasks = tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || 'No description',
            status: task.status,
            priority: task.priority,
            assignedTo: `${task.assignedTo?.firstName || ''} ${task.assignedTo?.lastName || ''}`.trim(),
            createdBy: `${task.createdBy?.firstName || ''} ${task.createdBy?.lastName || ''}`.trim(),
            dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
            createdAt: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'Unknown',
            completedAt: task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Not completed',
            actualHours: task.actualHours || 'Not specified',
            estimatedHours: task.estimatedHours || 'Not specified'
          }));
          this.downloadService.generateTaskReport(formattedTasks, format);
        }
        this.isGenerating = false;
        this.showSuccessMessage(`Task report downloaded successfully as ${format.toUpperCase()}`);
      },
      error: (error) => {
        console.error('Error loading tasks for report:', error);
        alert('Error loading tasks. Generating sample report instead.');
        
        // Generate report with mock data on error
        const mockTasks = [
          {
            id: 1,
            title: 'Sample Task - Error Loading Real Data',
            description: 'This is a sample task shown due to loading error',
            status: 'PENDING',
            priority: 'MEDIUM',
            assignedTo: 'Sample Worker',
            createdBy: 'Sample Supervisor',
            dueDate: '2024-11-15',
            createdAt: '2024-11-01',
            completedAt: 'Not completed',
            actualHours: 'Not specified',
            estimatedHours: 'Not specified'
          }
        ];
        this.downloadService.generateTaskReport(mockTasks, format);
        this.isGenerating = false;
        this.showSuccessMessage(`Task report downloaded successfully as ${format.toUpperCase()} (using sample data due to error)`);
      }
    });
  }

  private generateFarmSummaryReport(format: 'pdf' | 'excel') {
    this.farmService.getMyFarms().subscribe({
      next: (farms) => {
        const selectedFarmData = farms.filter(farm => 
          this.selectedFarm ? farm.id === this.selectedFarm : true
        );
        
        if (selectedFarmData.length === 0) {
          // Use mock data if no real farms
          const mockFarms = [
            {
              id: this.selectedFarm || 1,
              name: 'Sample Farm',
              location: 'Sample Location',
              size: '100',
              sizeUnit: 'acres',
              description: 'Sample farm for demonstration',
              isActive: true,
              createdAt: '2024-10-01'
            }
          ];
          this.downloadService.generateFarmReport(mockFarms, format);
        } else {
          this.downloadService.generateFarmReport(selectedFarmData, format);
        }
        this.isGenerating = false;
        this.showSuccessMessage(`Farm summary report downloaded successfully as ${format.toUpperCase()}`);
      },
      error: (error) => {
        console.error('Error loading farms:', error);
        this.isGenerating = false;
        alert('Error loading farm data. Please try again.');
      }
    });
  }

  private showSuccessMessage(message: string) {
    alert(`✅ ${message}\n\nThe file has been downloaded to your Downloads folder.`);
  }



  canAccessReports(): boolean {
    return ['SYSTEM_ADMIN', 'SUPERVISOR', 'WORKER', 'FARM_OWNER'].includes(this.currentUserRole);
  }

  isDateRangeRequired(reportType: string): boolean {
    return reportType !== 'farm-summary';
  }

  isFarmRequired(reportType: string): boolean {
    return reportType === 'farm-summary';
  }
}