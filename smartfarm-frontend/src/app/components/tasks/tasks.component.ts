import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AttendanceService } from '../../services/attendance.service';
import { Task, TaskStatus, TaskPriority, TaskRequest } from '../../models/task.model';
import { LoginResponse } from '../../models/user.model';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  todayTasks: Task[] = [];
  currentUser: LoginResponse | null = null;
  availableUsers: any[] = [];
  loading = true;
  selectedStatus: string = 'ALL';
  searchTerm = '';
  showCreateModal = false;
  showTaskDetails = false;
  selectedTask: Task | null = null;
  taskForm!: FormGroup;
  submitting = false;

  // Attendance tracking
  todayAttendance: any = null;
  isCheckedIn = false;

  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private userService: UserService,
    private attendanceService: AttendanceService,
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    this.loadTasks();
    this.loadTodayAttendance();
    this.loadTasks();
    this.loadTodayAttendance();

    if (this.canCreateTasks()) {
      this.loadAvailableUsers();
    }
  }

  initializeForm(): void {
    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required]],
      description: [''],
      assignedToId: ['', [Validators.required]],
      dueDate: [''],
      priority: ['MEDIUM', [Validators.required]],
      estimatedHours: ['']
    });
  }

  loadTasks(): void {
    this.loading = true;

    // Load tasks based on user role
    const taskObservable = this.currentUser?.role === 'WORKER' 
      ? this.taskService.getMyTasks()  // Workers see only their assigned tasks
      : this.taskService.getTasksCreatedByMe();  // Supervisors see tasks they created

    console.log('Loading tasks for user role:', this.currentUser?.role);

    taskObservable.subscribe({
      next: (tasks) => {
        console.log('Tasks loaded:', tasks);
        this.tasks = tasks;
        this.applyFilters();
        this.loading = false;

        // Load today's tasks for workers
        if (this.currentUser?.role === 'WORKER') {
          this.loadTodayTasks();
        }
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });
  }

  loadTodayTasks(): void {
    this.taskService.getTodayTasks().subscribe({
      next: (tasks) => {
        this.todayTasks = tasks;
      },
      error: (error) => {
        console.error('Error loading today tasks:', error);
      }
    });
  }

  loadAvailableUsers(): void {
    this.userService.getMyUsers().subscribe({
      next: (users) => {
        // Only show workers for supervisors
        this.availableUsers = users.filter(user => user.role === 'WORKER');
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadTodayAttendance(): void {
    if (this.currentUser?.role === 'WORKER') {
      this.attendanceService.getTodayAttendance().subscribe({
        next: (attendance) => {
          this.todayAttendance = attendance;
          this.isCheckedIn = attendance && attendance.status === 'CHECKED_IN';
        },
        error: (error) => {
          console.log('No attendance record for today');
          this.isCheckedIn = false;
        }
      });
    }
  }

  // Task Management Methods
  canCreateTasks(): boolean {
    return this.currentUser?.role === 'SUPERVISOR';
  }

  canUpdateTask(task: Task): boolean {
    return task.assignedTo.id === this.currentUser?.id ||
      (task.createdBy.id === this.currentUser?.id && this.currentUser?.role === 'SUPERVISOR');
  }

  canStartTask(task: Task): boolean {
    return task.assignedTo.id === this.currentUser?.id && task.status === TaskStatus.PENDING;
  }

  canCompleteTask(task: Task): boolean {
    return task.assignedTo.id === this.currentUser?.id && task.status === TaskStatus.IN_PROGRESS;
  }

  openCreateModal(): void {
    this.taskForm.reset();
    this.taskForm.patchValue({ priority: 'MEDIUM' });
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.taskForm.reset();
  }

  createTask(): void {
    if (this.taskForm.invalid) {
      return;
    }

    const confirmed = confirm(
      `Create task "${this.taskForm.value.title}"?\n\n` +
      `Assigned to: ${this.getAssignedUserName()}\n` +
      `Priority: ${this.taskForm.value.priority}\n` +
      `Due date: ${this.taskForm.value.dueDate || 'Not set'}`
    );

    if (!confirmed) {
      return;
    }

    this.submitting = true;

    const taskData: TaskRequest = {
      ...this.taskForm.value,
      assignedToId: parseInt(this.taskForm.value.assignedToId)
    };

    this.taskService.createTask(taskData).subscribe({
      next: (response) => {
        alert('Task created successfully!\n\nThe assigned user will receive an email notification.');
        this.closeCreateModal();
        this.loadTasks();
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error creating task:', error);
        const errorMessage = error.error || error.message || 'Failed to create task';
        alert('Error creating task:\n\n' + errorMessage);
        this.submitting = false;
      }
    });
  }

  getAssignedUserName(): string {
    const userId = this.taskForm.value.assignedToId;
    const user = this.availableUsers.find(u => u.id == userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown';
  }

  startTask(task: Task): void {
    if (confirm(`Start working on "${task.title}"?`)) {
      this.taskService.startTask(task.id).subscribe({
        next: () => {
          alert('Task started successfully!');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error starting task:', error);
          alert('Failed to start task.');
        }
      });
    }
  }

  completeTask(task: Task): void {
    const notes = prompt('Add completion notes (optional):');
    const hoursStr = prompt('How many hours did this task take?');
    const hours = hoursStr ? parseInt(hoursStr) : undefined;

    if (confirm(`Mark "${task.title}" as completed?`)) {
      this.taskService.completeTask(task.id, notes || undefined, hours).subscribe({
        next: () => {
          alert('Task completed successfully!\n\nYour supervisor will be notified.');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error completing task:', error);
          alert('Failed to complete task.');
        }
      });
    }
  }

  viewTaskDetails(task: Task): void {
    this.selectedTask = task;
    this.showTaskDetails = true;
  }

  closeTaskDetails(): void {
    this.showTaskDetails = false;
    this.selectedTask = null;
  }

  // Attendance Methods
  checkIn(): void {
    const location = prompt('Enter your location (optional):');
    const notes = prompt('Add check-in notes (optional):');

    this.attendanceService.checkIn(notes || undefined, location || undefined).subscribe({
      next: (response) => {
        alert('Checked in successfully!');
        this.loadTodayAttendance();
      },
      error: (error) => {
        console.error('Error checking in:', error);
        const errorMessage = error.error || error.message || 'Failed to check in';
        alert('Check-in failed:\n\n' + errorMessage);
      }
    });
  }

  checkOut(): void {
    const location = prompt('Enter your location (optional):');
    const notes = prompt('Add check-out notes (optional):');

    if (confirm('Are you sure you want to check out?')) {
      this.attendanceService.checkOut(notes || undefined, location || undefined).subscribe({
        next: (response) => {
          alert('Checked out successfully!\n\n' + response);
          this.loadTodayAttendance();
        },
        error: (error) => {
          console.error('Error checking out:', error);
          const errorMessage = error.error || error.message || 'Failed to check out';
          alert('Check-out failed:\n\n' + errorMessage);
        }
      });
    }
  }

  // Filter and Search Methods
  applyFilters(): void {
    this.filteredTasks = this.tasks.filter(task => {
      const matchesStatus = this.selectedStatus === 'ALL' || task.status === this.selectedStatus;
      const matchesSearch = !this.searchTerm ||
        task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        `${task.assignedTo.firstName} ${task.assignedTo.lastName}`.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  // Utility Methods - FIXED: Added missing methods
  getStatusClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusColor(status: TaskStatus): string {
    // Added this method for template compatibility
    return this.getStatusClass(status);
  }

  getPriorityClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.LOW:
        return 'text-gray-600';
      case TaskPriority.MEDIUM:
        return 'text-blue-600';
      case TaskPriority.HIGH:
        return 'text-orange-600';
      case TaskPriority.URGENT:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getPriorityColor(priority: TaskPriority): string {
    // Added this method for template compatibility
    return this.getPriorityClass(priority);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
  }
}