import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  contactForm!: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  showSystemInfo = false;
  showContactForm = false;
  submittingApplication = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    
    this.contactForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      farmType: [''],
      expectedUsers: [''],
      comments: ['']
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    console.log('Form submission started');
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form values:', this.loginForm.value);
    
    if (this.loginForm.invalid) {
      console.log('Form is invalid, marking all fields as touched');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const loginData = {
      username: this.loginForm.value.username?.trim(),
      password: this.loginForm.value.password?.trim()
    };
    
    console.log('Sending login request with data:', { username: loginData.username, password: '[HIDDEN]' });
    console.log('API URL:', this.authService);
    
    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.loading = false;
        this.error = ''; // Clear any previous errors
        
        // Check if user must change password
        if (response.mustChangePassword) {
          const changePassword = confirm(
            'Welcome! For security reasons, you must change your password on first login.\n\n' +
            'Would you like to change your password now?\n\n' +
            'Click OK to change password, or Cancel to continue (you will be prompted again next time).'
          );
          
          if (changePassword) {
            this.promptPasswordChange();
          }
        }
        
        // Add a small delay to ensure token is properly set before navigation
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 100);
      },
      error: (error) => {
        console.error('Login error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        console.error('Error details:', error.error);
        
        this.loading = false;
        
        // Provide more specific error messages
        if (error.status === 0) {
          this.error = 'Unable to connect to server. Please check if the backend is running.';
        } else if (error.status === 401) {
          this.error = 'Invalid username or password. Please try again.';
        } else if (error.status === 403) {
          this.error = 'Access denied. Your account may be inactive.';
        } else if (error.status >= 500) {
          this.error = 'Server error. Please try again later.';
        } else {
          // Handle different error response formats
          let errorMessage = 'Login failed. Please check your credentials.';
          
          if (error.error) {
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.error) {
              errorMessage = error.error.error;
            } else if (typeof error.error === 'object') {
              // Try to extract meaningful information from the error object
              try {
                const errorObj = error.error;
                if (errorObj.status && errorObj.message) {
                  errorMessage = errorObj.message;
                } else {
                  errorMessage = JSON.stringify(errorObj);
                }
              } catch (e) {
                errorMessage = 'An unexpected error occurred. Please try again.';
              }
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.error = errorMessage;
        }
      }
    });
  }

  closeContactForm(): void {
    this.showContactForm = false;
    this.submittingApplication = false;
    this.contactForm.reset();
    
    // Reset form to pristine state
    this.contactForm.markAsUntouched();
    this.contactForm.markAsPristine();
  }

  submitApplication(): void {
    if (this.contactForm.invalid) {
      return;
    }

    // Show confirmation dialog
    const confirmed = confirm(
      'Are you sure you want to submit this application?\n\n' +
      `Name: ${this.contactForm.value.firstName} ${this.contactForm.value.lastName}\n` +
      `Email: ${this.contactForm.value.email}\n` +
      `Phone: ${this.contactForm.value.phone}\n\n` +
      'Click OK to submit or Cancel to review your information.'
    );

    if (!confirmed) {
      return;
    }

    this.submittingApplication = true;

    // Create application data
    const applicationData = {
      ...this.contactForm.value,
      applicationDate: new Date().toISOString(),
      status: 'pending'
    };

    // Send application to backend
    this.authService.submitFarmOwnerApplication(applicationData).subscribe({
      next: (response) => {
        this.handleSuccessfulSubmission();
      },
      error: (error) => {
        this.submittingApplication = false;
        console.error('Application submission error:', error);
        
        // Check if it's likely that the email was sent despite the error
        if (error.status >= 500 || error.status === 0) {
          // Server error or network issue - email might have been sent
          const userChoice = confirm(
            '⚠️ Submission Status Unclear\n\n' +
            'There was a server communication issue, but your application may have been received.\n\n' +
            '📧 Please check your email for a confirmation message.\n\n' +
            'Click OK if you received an email confirmation (we\'ll close this form)\n' +
            'Click Cancel to try submitting again'
          );
          
          if (userChoice) {
            // User confirmed they got the email - treat as success
            this.handleSuccessfulSubmission();
          }
        } else if (error.status === 409) {
          // Duplicate application
          alert('⚠️ Application Already Exists\n\nYou have already submitted an application with this email address.\nPlease check your email for previous confirmations.');
          this.handleSuccessfulSubmission();
        } else {
          // Other errors - likely genuine failures
          const errorMessage = error.error?.message || error.message || 'Unknown error occurred';
          alert('❌ Submission Failed\n\n' + errorMessage + '\n\nPlease try again or contact us directly for assistance.');
        }
      }
    });
  }

  private handleSuccessfulSubmission(): void {
    this.submittingApplication = false;
    
    // Show success message
    alert('✅ Application Submitted Successfully!\n\n' +
          '📧 You will receive an email confirmation shortly.\n' +
          '⏰ Our team will review your application within 24 hours.\n\n' +
          'Thank you for choosing SmartFarm360!\n\n' +
          'You will now be redirected to the login page.');
    
    // Close the contact form
    this.closeContactForm();
    
    // Optional: Add a small delay before hiding system info to let user see the success
    setTimeout(() => {
      this.showSystemInfo = false;
    }, 1000);
  }

  private promptPasswordChange(): void {
    const currentPassword = prompt('Enter your current password:');
    if (!currentPassword) {
      return;
    }

    const newPassword = prompt('Enter your new password (minimum 8 characters):');
    if (!newPassword || newPassword.length < 8) {
      if (newPassword !== null) {
        alert('Password must be at least 8 characters long.');
      }
      return;
    }

    const confirmPassword = prompt('Confirm your new password:');
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    // Call password change service
    this.authService.changePassword({
      currentPassword,
      newPassword,
      confirmPassword
    }).subscribe({
      next: (response) => {
        alert('Password changed successfully! You can now use your new password for future logins.');
      },
      error: (error) => {
        const errorMessage = error.error || error.message || 'Failed to change password.';
        alert('Error: ' + errorMessage);
      }
    });
  }
}