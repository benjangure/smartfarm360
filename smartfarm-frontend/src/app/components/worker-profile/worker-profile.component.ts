import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-worker-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './worker-profile.component.html',
  styleUrls: ['./worker-profile.component.scss']
})
export class WorkerProfileComponent implements OnInit {
  currentUser: any;
  isEditing = false;
  loading = false;
  error = '';
  success = '';
  
  profileData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    skills: [] as string[],
    experience: '',
    notes: ''
  };

  availableSkills = [
    'Crop Management',
    'Irrigation Systems',
    'Pest Control',
    'Harvesting',
    'Equipment Operation',
    'Greenhouse Management',
    'Organic Farming',
    'Soil Management',
    'Fertilization',
    'Pruning',
    'Planting',
    'Quality Control'
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProfile();
  }

  loadProfile() {
    if (this.currentUser) {
      this.profileData = {
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        address: this.currentUser.address || '',
        emergencyContact: this.currentUser.emergencyContact || '',
        emergencyPhone: this.currentUser.emergencyPhone || '',
        skills: this.currentUser.skills || [],
        experience: this.currentUser.experience || '',
        notes: this.currentUser.notes || ''
      };
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadProfile(); // Reset changes if canceling
    }
    this.error = '';
    this.success = '';
  }

  toggleSkill(skill: string) {
    const index = this.profileData.skills.indexOf(skill);
    if (index > -1) {
      this.profileData.skills.splice(index, 1);
    } else {
      this.profileData.skills.push(skill);
    }
  }

  hasSkill(skill: string): boolean {
    return this.profileData.skills.includes(skill);
  }

  saveProfile() {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.userService.updateProfile(this.profileData).subscribe({
      next: (response) => {
        this.success = 'Profile updated successfully!';
        this.isEditing = false;
        this.loading = false;
        
        // Update current user data
        this.authService.updateCurrentUser(response);
        this.currentUser = response;
      },
      error: (error) => {
        this.error = 'Failed to update profile. Please try again.';
        this.loading = false;
        console.error('Profile update error:', error);
      }
    });
  }

  getInitials(): string {
    const first = this.profileData.firstName.charAt(0).toUpperCase();
    const last = this.profileData.lastName.charAt(0).toUpperCase();
    return first + last;
  }

  getExperienceYears(): number {
    if (!this.profileData.experience) return 0;
    const match = this.profileData.experience.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}