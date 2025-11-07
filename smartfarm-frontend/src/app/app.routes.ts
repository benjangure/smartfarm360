import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'apply-farm-owner',
    loadComponent: () => import('./components/farm-owner-application/farm-owner-application.component').then(m => m.FarmOwnerApplicationComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'tasks',
        loadComponent: () => import('./components/tasks/tasks.component').then(m => m.TasksComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./components/attendance/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'farms',
        loadComponent: () => import('./components/farms/farms.component').then(m => m.FarmsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'FARM_OWNER', 'SUPERVISOR'] }
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'SUPERVISOR'] }
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'applications',
        loadComponent: () => import('./components/admin-applications/admin-applications.component').then(m => m.AdminApplicationsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'farm-owners',
        loadComponent: () => import('./components/farm-owners-list/farm-owners-list.component').then(m => m.FarmOwnersListComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN'] }
      },
      {
        path: 'assigned-supervisors',
        loadComponent: () => import('./components/assigned-supervisors/assigned-supervisors.component').then(m => m.AssignedSupervisorsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SYSTEM_ADMIN', 'FARM_OWNER'] }
      },
      {
        path: 'attendance-history',
        loadComponent: () => import('./components/attendance-history/attendance-history.component').then(m => m.AttendanceHistoryComponent),
        canActivate: [RoleGuard],
        data: { roles: ['WORKER', 'SUPERVISOR', 'FARM_OWNER', 'SYSTEM_ADMIN'] }
      },
      {
        path: 'messages',
        loadComponent: () => import('./components/messages/messages.component').then(m => m.MessagesComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./components/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'add-supervisor',
        loadComponent: () => import('./components/add-supervisor/add-supervisor.component').then(m => m.AddSupervisorComponent),
        canActivate: [RoleGuard],
        data: { roles: ['FARM_OWNER'] }
      },
      {
        path: 'supervisors',
        loadComponent: () => import('./components/supervisors-list/supervisors-list.component').then(m => m.SupervisorsListComponent),
        canActivate: [RoleGuard],
        data: { roles: ['FARM_OWNER'] }
      },
      {
        path: 'add-worker',
        loadComponent: () => import('./components/add-worker/add-worker.component').then(m => m.AddWorkerComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERVISOR'] }
      },
      {
        path: 'workers',
        loadComponent: () => import('./components/workers-list/workers-list.component').then(m => m.WorkersListComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERVISOR'] }
      },
      {
        path: 'assign-tasks',
        loadComponent: () => import('./components/assign-tasks/assign-tasks.component').then(m => m.AssignTasksComponent),
        canActivate: [RoleGuard],
        data: { roles: ['SUPERVISOR'] }
      },
      {
        path: 'supervisor-farm-management',
        loadComponent: () => import('./components/supervisor-farm-management/supervisor-farm-management.component').then(m => m.SupervisorFarmManagementComponent),
        canActivate: [RoleGuard],
        data: { roles: ['FARM_OWNER'] }
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];