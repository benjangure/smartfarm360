import { LoginResponse } from './user.model';

export interface Task {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: LoginResponse;
  createdBy: LoginResponse;
  farm?: {
    id: number;
    name: string;
  };
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  completionNotes?: string;
  reasonForDelay?: string;
  estimatedCompletionDate?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NOT_DONE = 'NOT_DONE',
  TO_BE_DONE_LATER = 'TO_BE_DONE_LATER',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface TaskRequest {
  title: string;
  description?: string;
  category?: string;
  assignedToId: number;
  dueDate?: string;
  priority: TaskPriority;
  estimatedHours?: number;
}

export interface TaskUpdateRequest {
  status?: TaskStatus;
  completionNotes?: string;
  actualHours?: number;
  photoUrl?: string;
  reasonForDelay?: string;
  estimatedCompletionDate?: string;
}