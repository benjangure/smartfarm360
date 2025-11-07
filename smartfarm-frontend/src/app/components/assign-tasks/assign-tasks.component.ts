import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { User } from '../../models/user.model';
import { TaskRequest, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-assign-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './assign-tasks.component.html',
  styleUrls: ['./assign-tasks.component.scss']
})
export class AssignTasksComponent implements OnInit {
  taskForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  workers: User[] = [];
  currentUser: any;

  taskCategories = [
    'Planting',
    'Watering',
    'Harvesting',
    'Fertilizing',
    'Pest Control',
    'Equipment Maintenance',
    'Livestock Care',
    'General Maintenance',
    'Other'
  ];

  priorities = [
    { value: 'LOW', label: 'Low Priority', color: 'text-green-600' },
    { value: 'MEDIUM', label: 'Medium Priority', color: 'text-yellow-600' },
    { value: 'HIGH', label: 'High Priority', color: 'text-red-600' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    this.loadWorkers();
  }

  initializeForm(): void {
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    this.taskForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      assignedToId: ['', [Validators.required]],
      dueDate: [tomorrowString, [Validators.required]],
      priority: ['MEDIUM', [Validators.required]],
      estimatedHours: ['']
    });
  }

  loadWorkers(): void {
    this.userService.getMyUsers().subscribe({
      next: (users) => {
        this.workers = users.filter(user => user.role === 'WORKER' && user.isActive);
      },
      error: (error) => {
        console.error('Error loading workers:', error);
        this.error = 'Failed to load workers. Please try again.';
      }
    });
  }

  get f() {
    return this.taskForm.controls;
  }

  onSubmit(): void {
    if (this.taskForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const taskData: TaskRequest = {
      title: this.taskForm.value.title.trim(),
      description: this.taskForm.value.description.trim(),
      assignedToId: parseInt(this.taskForm.value.assignedToId),
      dueDate: this.taskForm.value.dueDate,
      priority: this.taskForm.value.priority as TaskPriority,
      estimatedHours: this.taskForm.value.estimatedHours ? parseInt(this.taskForm.value.estimatedHours) : undefined
    };

    this.taskService.createTask(taskData).subscribe({
      next: (response) => {
        console.log('Task creation response:', response);
        
        // Handle both string and object responses
        let successMessage = 'Task assigned successfully! The worker will be notified via email.';
        if (response && typeof response === 'object' && response.message) {
          successMessage = response.message;
        } else if (typeof response === 'string') {
          successMessage = response;
        }
        
        this.success = successMessage;
        this.loading = false;
        
        // Reset form
        this.taskForm.reset();
        this.initializeForm();
        
        // Redirect after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard/tasks']);
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating task:', error);
        
        // Better error message extraction
        let errorMessage = 'Failed to assign task. Please try again.';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.error) {
            errorMessage = error.error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        
        // Handle specific HTTP status codes
        if (error.status === 400) {
          errorMessage = 'Invalid task data. Please check your inputs and try again.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to assign tasks to this worker.';
        } else if (error.status === 404) {
          errorMessage = 'Worker not found. Please select a valid worker.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later or contact support.';
        }
        
        this.error = errorMessage;
        this.loading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  getWorkerName(workerId: string): string {
    const worker = this.workers.find(w => w.id === parseInt(workerId));
    return worker ? `${worker.firstName} ${worker.lastName}` : 'Unknown Worker';
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }
}