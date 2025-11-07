import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRegistrationRequest, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  showPassword = false;
  showConfirmPassword = false;

  userRoles = [
    { value: UserRole.SYSTEM_ADMIN, label: 'System Administrator', icon: 'fas fa-crown', description: 'Full system access and management' },
    { value: UserRole.FARM_OWNER, label: 'Farm Owner', icon: 'fas fa-user-tie', description: 'Farm ownership and supervisor management' },
    { value: UserRole.SUPERVISOR, label: 'Supervisor', icon: 'fas fa-user-cog', description: 'Team and farm management' },
    { value: UserRole.WORKER, label: 'Farm Worker', icon: 'fas fa-hard-hat', description: 'Task execution and attendance' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
      role: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      delete confirmPassword.errors!['passwordMismatch'];
      if (Object.keys(confirmPassword.errors!).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  get f() {
    return this.registerForm.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const registrationData: UserRegistrationRequest = {
      username: this.registerForm.value.username.trim(),
      email: this.registerForm.value.email.trim(),
      firstName: this.registerForm.value.firstName.trim(),
      lastName: this.registerForm.value.lastName.trim(),
      phoneNumber: this.registerForm.value.phoneNumber?.trim() || undefined,
      role: this.registerForm.value.role,
      password: this.registerForm.value.password
    };

    this.authService.register(registrationData).subscribe({
      next: (response) => {
        this.success = 'Registration successful! You can now login with your credentials.';
        this.loading = false;
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  getRoleIcon(role: string): string {
    const roleObj = this.userRoles.find(r => r.value === role);
    return roleObj?.icon || 'fas fa-user';
  }

  getRoleDescription(role: string): string {
    const roleObj = this.userRoles.find(r => r.value === role);
    return roleObj?.description || '';
  }
}