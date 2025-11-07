import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { UserRegistrationRequest, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-add-worker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-worker.component.html',
  styleUrls: ['./add-worker.component.scss']
})
export class AddWorkerComponent implements OnInit {
  workerForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  currentUser: any;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
  }

  initializeForm(): void {
    this.workerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      sendCredentials: [true] // Whether to send credentials via email
    });
  }

  get f() {
    return this.workerForm.controls;
  }

  onSubmit(): void {
    if (this.workerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    // Generate username from name
    const firstName = this.workerForm.value.firstName.toLowerCase();
    const lastName = this.workerForm.value.lastName.toLowerCase();
    const username = `${firstName}.${lastName}.${Date.now().toString().slice(-4)}`;

    // Generate temporary password
    const tempPassword = this.generatePassword();

    const workerData: UserRegistrationRequest = {
      username: username,
      email: this.workerForm.value.email.trim(),
      firstName: this.workerForm.value.firstName.trim(),
      lastName: this.workerForm.value.lastName.trim(),
      phoneNumber: this.workerForm.value.phoneNumber?.trim() || undefined,
      role: UserRole.WORKER,
      password: tempPassword,
      farmId: this.currentUser?.farmId, // Assign to supervisor's farm
      mustChangePassword: true // Force password change on first login
    };

    this.userService.createUser(workerData).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Backend returns plain text, so response is already a string
        const message = response || 'Worker created successfully!';
        this.success = message;
        
        // Show success alert
        alert('✅ ' + message);
        
        // Show credentials if not sending via email
        if (!this.workerForm.value.sendCredentials) {
          alert(`Worker created!\n\nUsername: ${username}\nPassword: ${tempPassword}\n\nPlease share these credentials securely.`);
        }
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/dashboard/workers']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating worker:', error);
        
        // Handle different error response formats
        let errorMessage = 'Failed to create worker. Please try again.';
        
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
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
    Object.keys(this.workerForm.controls).forEach(key => {
      const control = this.workerForm.get(key);
      control?.markAsTouched();
    });
  }
}