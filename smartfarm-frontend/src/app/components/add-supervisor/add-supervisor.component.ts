import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FarmService } from '../../services/farm.service';
import { AuthService } from '../../services/auth.service';
import { UserRegistrationRequest, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-add-supervisor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-supervisor.component.html',
  styleUrls: ['./add-supervisor.component.scss']
})
export class AddSupervisorComponent implements OnInit {
  supervisorForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  farms: any[] = [];
  currentUser: any;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private farmService: FarmService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    this.loadFarms();
  }

  initializeForm(): void {
    this.supervisorForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      assignedFarmId: ['', [Validators.required]],
      sendCredentials: [true] // Whether to send credentials via email
    });
  }

  loadFarms(): void {
    this.farmService.getMyFarms().subscribe({
      next: (farms) => {
        this.farms = farms;
      },
      error: (error) => {
        console.error('Error loading farms:', error);
        this.error = 'Failed to load farms. Please try again.';
      }
    });
  }

  get f() {
    return this.supervisorForm.controls;
  }

  onSubmit(): void {
    if (this.supervisorForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    // Check if user is logged in and has permission
    if (!this.currentUser) {
      this.error = 'You are not logged in. Please login again.';
      return;
    }

    if (this.currentUser.role !== 'FARM_OWNER' && this.currentUser.role !== 'SYSTEM_ADMIN') {
      this.error = 'You do not have permission to create supervisors.';
      return;
    }

    if (this.farms.length === 0) {
      this.error = 'No farms available. Please create a farm first.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Generate username from name
    const firstName = this.supervisorForm.value.firstName.toLowerCase();
    const lastName = this.supervisorForm.value.lastName.toLowerCase();
    const username = `${firstName}.${lastName}.${Date.now().toString().slice(-4)}`;

    // Generate temporary password
    const tempPassword = this.generatePassword();

    const supervisorData: UserRegistrationRequest = {
      username: username,
      email: this.supervisorForm.value.email.trim(),
      firstName: this.supervisorForm.value.firstName.trim(),
      lastName: this.supervisorForm.value.lastName.trim(),
      phoneNumber: this.supervisorForm.value.phoneNumber?.trim() || undefined,
      role: UserRole.SUPERVISOR,
      password: tempPassword,
      farmId: parseInt(this.supervisorForm.value.assignedFarmId), // Changed from assignedFarmId to farmId
      mustChangePassword: true // Force password change on first login
    };



    this.userService.createUser(supervisorData).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Backend returns plain text, so response is already a string
        const message = response || 'Supervisor created successfully!';
        this.success = message;
        
        // Show success alert
        alert('✅ ' + message);
        
        // Show credentials if not sending via email
        if (!this.supervisorForm.value.sendCredentials) {
          alert(`Supervisor created!\n\nUsername: ${username}\nPassword: ${tempPassword}\n\nPlease share these credentials securely.`);
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard/supervisors']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating supervisor:', error);
        
        // Handle different error response formats
        let errorMessage = 'Failed to create supervisor. Please try again.';
        
        if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to create supervisors.';
        } else if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (typeof error.error === 'object') {
            errorMessage = JSON.stringify(error.error);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.error = errorMessage;

      }
    });
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.supervisorForm.controls).forEach(key => {
      const control = this.supervisorForm.get(key);
      control?.markAsTouched();
    });
  }

  getFarmName(farmId: string): string {
    const farm = this.farms.find(f => f.id === parseInt(farmId));
    return farm ? farm.name : 'Unknown Farm';
  }

}