import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginResponse } from '../../models/user.model';
import { ChatModalComponent } from '../chat-modal/chat-modal.component';
import { MessageNotificationsComponent } from '../message-notifications/message-notifications.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ChatModalComponent, MessageNotificationsComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  currentUser: LoginResponse | null = null;
  sidebarOpen = false;
  showChatModal = false;

  menuItems = [
    {
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      roles: ['SYSTEM_ADMIN', 'FARM_OWNER', 'SUPERVISOR', 'WORKER']
    },
    // System Admin Only
    {
      label: 'Applications',
      icon: 'fas fa-clipboard-list',
      route: '/dashboard/applications',
      roles: ['SYSTEM_ADMIN']
    },
    {
      label: 'All Users',
      icon: 'fas fa-users-cog',
      route: '/dashboard/users',
      roles: ['SYSTEM_ADMIN']
    },
    {
      label: 'Farm Owners',
      icon: 'fas fa-user-tie',
      route: '/dashboard/farm-owners',
      roles: ['SYSTEM_ADMIN']
    },
    // Farm Owner Only
    {
      label: 'My Farms',
      icon: 'fas fa-seedling',
      route: '/dashboard/farms',
      roles: ['FARM_OWNER']
    },
    {
      label: 'My Supervisors',
      icon: 'fas fa-user-cog',
      route: '/dashboard/supervisors',
      roles: ['FARM_OWNER']
    },
    {
      label: 'Supervisor Assignments',
      icon: 'fas fa-cogs',
      route: '/dashboard/supervisor-farm-management',
      roles: ['FARM_OWNER']
    },
    {
      label: 'Add Supervisor',
      icon: 'fas fa-user-plus',
      route: '/dashboard/add-supervisor',
      roles: ['FARM_OWNER']
    },
    // Supervisor Only
    {
      label: 'My Workers',
      icon: 'fas fa-hard-hat',
      route: '/dashboard/workers',
      roles: ['SUPERVISOR']
    },
    {
      label: 'Add Worker',
      icon: 'fas fa-user-plus',
      route: '/dashboard/add-worker',
      roles: ['SUPERVISOR']
    },
    {
      label: 'Assign Tasks',
      icon: 'fas fa-tasks',
      route: '/dashboard/assign-tasks',
      roles: ['SUPERVISOR']
    },
    {
      label: 'Monitor Attendance',
      icon: 'fas fa-clock',
      route: '/dashboard/attendance',
      roles: ['SUPERVISOR']
    },
    // Shared - Messages
    {
      label: 'Messages',
      icon: 'fas fa-comments',
      route: '/dashboard/messages',
      roles: ['SYSTEM_ADMIN', 'FARM_OWNER', 'SUPERVISOR', 'WORKER']
    },
    // Shared - Reports (Not available for workers)
    {
      label: 'Reports',
      icon: 'fas fa-chart-bar',
      route: '/dashboard/reports',
      roles: ['SYSTEM_ADMIN', 'FARM_OWNER', 'SUPERVISOR']
    },
    {
      label: 'Attendance History',
      icon: 'fas fa-history',
      route: '/dashboard/attendance-history',
      roles: ['SYSTEM_ADMIN', 'FARM_OWNER', 'SUPERVISOR', 'WORKER']
    },
    // Worker Only
    {
      label: 'My Tasks',
      icon: 'fas fa-list-check',
      route: '/dashboard/tasks',
      roles: ['WORKER']
    },
    {
      label: 'Check In/Out',
      icon: 'fas fa-clock',
      route: '/dashboard/attendance',
      roles: ['WORKER']
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  hasAccess(roles: string[]): boolean {
    return this.authService.hasRole(roles);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleColor(): string {
    if (!this.currentUser) return 'bg-gray-500';
    
    switch (this.currentUser.role) {
      case 'SYSTEM_ADMIN':
        return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'FARM_OWNER':
        return 'bg-gradient-to-br from-purple-500 to-purple-600';
      case 'SUPERVISOR':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      case 'WORKER':
        return 'bg-gradient-to-br from-green-500 to-green-600';
      default:
        return 'bg-gray-500';
    }
  }

  getRoleBadgeColor(): string {
    if (!this.currentUser) return 'bg-gray-100 text-gray-800';
    
    switch (this.currentUser.role) {
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

  getRoleIcon(): string {
    if (!this.currentUser) return 'fas fa-user';
    
    switch (this.currentUser.role) {
      case 'SYSTEM_ADMIN':
        return 'fas fa-crown';
      case 'FARM_OWNER':
        return 'fas fa-user-tie';
      case 'SUPERVISOR':
        return 'fas fa-user-cog';
      case 'WORKER':
        return 'fas fa-hard-hat';
      default:
        return 'fas fa-user';
    }
  }

  openChat(): void {
    this.showChatModal = true;
  }

  closeChatModal(): void {
    this.showChatModal = false;
  }

  getChatRecipientName(): string {
    if (!this.currentUser) return 'Chat';
    
    switch (this.currentUser.role) {
      case 'WORKER':
        return 'Chat with Supervisor';
      case 'SUPERVISOR':
        return 'Team Chat';
      case 'FARM_OWNER':
        return 'Management Chat';
      case 'SYSTEM_ADMIN':
        return 'Admin Chat';
      default:
        return 'Chat';
    }
  }
}