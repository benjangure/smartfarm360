import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { LoginResponse, UserRole } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  loading = true;
  currentUser: LoginResponse | null = null;
  showCreateModal = false;
  selectedUser: any = null;
  userForm!: FormGroup;
  submitting = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.initializeForm();
    this.loadUsers();
  }

  initializeForm(): void {
    this.userForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      role: ['', [Validators.required]]
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getMyUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  // Get available roles based on current user's role
  getAvailableRoles(): string[] {
    if (!this.currentUser) return [];
    
    switch (this.currentUser.role) {
      case 'SYSTEM_ADMIN':
        return ['FARM_OWNER', 'SUPERVISOR', 'WORKER'];
      case 'FARM_OWNER':
        return ['SUPERVISOR'];
      case 'SUPERVISOR':
        return ['WORKER'];
      default:
        return [];
    }
  }

  canCreateUsers(): boolean {
    return this.currentUser?.role === 'SYSTEM_ADMIN' || 
           this.currentUser?.role === 'FARM_OWNER' || 
           this.currentUser?.role === 'SUPERVISOR';
  }

  getCreateButtonText(): string {
    switch (this.currentUser?.role) {
      case 'FARM_OWNER':
        return 'Add Supervisor';
      case 'SUPERVISOR':
        return 'Add Worker';
      default:
        return 'Add User';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'fas fa-crown text-red-600';
      case 'FARM_OWNER':
        return 'fas fa-user-tie text-purple-600';
      case 'SUPERVISOR':
        return 'fas fa-user-cog text-blue-600';
      case 'WORKER':
        return 'fas fa-hard-hat text-green-600';
      default:
        return 'fas fa-user text-gray-600';
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'FARM_OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'SUPERVISOR':
        return 'bg-blue-100 text-blue-800';
      case 'WORKER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  openCreateModal(): void {
    this.selectedUser = null;
    this.userForm.reset();
    
    // Set default role based on current user
    if (this.currentUser?.role === 'FARM_OWNER') {
      this.userForm.patchValue({ role: 'SUPERVISOR' });
    } else if (this.currentUser?.role === 'SUPERVISOR') {
      this.userForm.patchValue({ role: 'WORKER' });
    }
    
    this.showCreateModal = true;
  }

  closeModal(): void {
    this.showCreateModal = false;
    this.selectedUser = null;
    this.userForm.reset();
  }

  createUser(): void {
    if (this.userForm.invalid) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to create this ${this.userForm.value.role.toLowerCase()}?\n\n` +
      `Name: ${this.userForm.value.firstName} ${this.userForm.value.lastName}\n` +
      `Email: ${this.userForm.value.email}\n` +
      `Role: ${this.userForm.value.role}\n\n` +
      'Login credentials will be sent to their email address.'
    );

    if (!confirmed) {
      return;
    }

    this.submitting = true;

    this.userService.createUser(this.userForm.value).subscribe({
      next: (response) => {
        alert('User created successfully!\n\nLogin credentials have been sent to their email address.');
        this.closeModal();
        this.loadUsers();
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error creating user:', error);
        const errorMessage = error.error || error.message || 'Failed to create user';
        alert('Error creating user:\n\n' + errorMessage);
        this.submitting = false;
      }
    });
  }

  deleteUser(user: any): void {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?\n\nThis action cannot be undone.`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          alert('User deleted successfully.');
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          
          let errorMessage = 'Failed to delete user.';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 403) {
            errorMessage = 'You do not have permission to delete this user.';
          } else if (error.status === 404) {
            errorMessage = 'User not found.';
          } else if (error.status === 409) {
            errorMessage = 'Cannot delete user. They may have associated data.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  toggleUserStatus(user: any): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
      this.userService.toggleUserStatus(user.id).subscribe({
        next: () => {
          user.isActive = !user.isActive;
          alert(`User ${action}d successfully.`);
        },
        error: (error) => {
          console.error('Error toggling user status:', error);
          alert(`Failed to ${action} user.`);
        }
      });
    }
  }

  // Missing utility methods
  getActiveUsersCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  getFarmOwnersCount(): number {
    return this.users.filter(u => u.role === 'FARM_OWNER').length;
  }

  getSupervisorsCount(): number {
    return this.users.filter(u => u.role === 'SUPERVISOR').length;
  }

  getRoleAvatarClass(role: string): string {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'bg-red-500';
      case 'FARM_OWNER':
        return 'bg-purple-500';
      case 'SUPERVISOR':
        return 'bg-blue-500';
      case 'WORKER':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }

  getStatusClass(isActive: boolean): string {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  editUser(user: any): void {
    const firstName = prompt('First Name:', user.firstName);
    if (firstName === null) return; // User cancelled
    
    const lastName = prompt('Last Name:', user.lastName);
    if (lastName === null) return; // User cancelled
    
    const email = prompt('Email:', user.email);
    if (email === null) return; // User cancelled
    
    const phoneNumber = prompt('Phone Number:', user.phoneNumber || '');
    if (phoneNumber === null) return; // User cancelled
    
    // Validate inputs
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      alert('First name, last name, and email are required.');
      return;
    }
    
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim() || undefined
    };
    
    const confirmMessage = `
Confirm changes for ${user.firstName} ${user.lastName}:

First Name: ${user.firstName} → ${updateData.firstName}
Last Name: ${user.lastName} → ${updateData.lastName}
Email: ${user.email} → ${updateData.email}
Phone: ${user.phoneNumber || 'Not set'} → ${updateData.phoneNumber || 'Not set'}

Do you want to save these changes?
    `;
    
    if (confirm(confirmMessage)) {
      this.userService.updateUser(user.id, updateData).subscribe({
        next: (updatedUser) => {
          // Update the user in the list
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          alert('User updated successfully!');
        },
        error: (error) => {
          console.error('Error updating user:', error);
          
          let errorMessage = 'Failed to update user. Please try again.';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 403) {
            errorMessage = 'You do not have permission to update this user.';
          } else if (error.status === 404) {
            errorMessage = 'User not found.';
          }
          
          alert(errorMessage);
        }
      });
    }
  }
}