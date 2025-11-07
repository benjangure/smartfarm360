import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface FarmOwnerApplicationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  farmType?: string;
  expectedUsers?: string;
  comments?: string;
}

@Component({
  selector: 'app-farm-owner-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './farm-owner-application.component.html',
  styleUrls: ['./farm-owner-application.component.scss']
})
export class FarmOwnerApplicationComponent implements OnInit {
  applicationForm!: FormGroup;
  loading = false;
  error = '';
  showConfirmDialog = false;

  businessTypes = [
    'Crop Farming',
    'Livestock Farming',
    'Mixed Farming',
    'Organic Farming',
    'Dairy Farming',
    'Poultry Farming',
    'Aquaculture',
    'Other'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Clear any existing authentication data since this is a public form
    if (this.authService.isLoggedIn()) {
      // If user is already logged in, redirect to dashboard
      this.router.navigate(['/dashboard']);
      return;
    }

    // Clear any invalid tokens that might be causing issues
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');

    this.applicationForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      farmType: [''],
      expectedUsers: [''],
      comments: ['', [Validators.minLength(10)]]
    });
  }

  get f() {
    return this.applicationForm.controls;
  }

  onSubmit(): void {
    if (this.applicationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }
    this.showConfirmDialog = true;
  }

  confirmSubmission(): void {
    this.loading = true;
    this.error = '';
    this.showConfirmDialog = false;

    const applicationData: FarmOwnerApplicationRequest = {
      firstName: this.applicationForm.value.firstName.trim(),
      lastName: this.applicationForm.value.lastName.trim(),
      email: this.applicationForm.value.email.trim(),
      phone: this.applicationForm.value.phone.trim(),
      farmType: this.applicationForm.value.farmType || '',
      expectedUsers: this.applicationForm.value.expectedUsers || '',
      comments: this.applicationForm.value.comments?.trim() || ''
    };

    // Use direct HTTP call to avoid any auth service interference
    this.http.post(`${environment.apiUrl}/applications/submit`, applicationData).subscribe({
      next: (response) => {
        this.loading = false;
        // Show success message and redirect to login
        alert('✅ Application submitted successfully!\n\n📧 You will receive an email confirmation shortly.\n⏰ Our team will review your application within 24 hours.\n\nOnce approved, you can log in and create your farms.\n\nThank you for choosing SmartFarm360!');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Application submission error:', error);
        
        // Handle specific error cases
        if (error.status === 401) {
          // Clear any invalid tokens and show helpful message
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          this.error = 'Authentication issue detected. Please try submitting again.';
        } else if (error.status === 0) {
          this.error = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (error.status >= 500) {
          this.error = 'Server error occurred. Your application may have been received. Please check your email for confirmation.';
        } else {
          this.error = error.error?.message || 'Application submission failed. Please try again.';
        }
      }
    });
  }

  cancelSubmission(): void {
    this.showConfirmDialog = false;
  }



  private markFormGroupTouched(): void {
    Object.keys(this.applicationForm.controls).forEach(key => {
      const control = this.applicationForm.get(key);
      control?.markAsTouched();
    });
  }
}