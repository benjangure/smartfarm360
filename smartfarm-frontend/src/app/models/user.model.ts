export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  assignedFarm?: Farm;
  supervisedFarms?: SimpleFarm[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SimpleFarm {
  id: number;
  name: string;
  location: string;
}

export interface Farm {
  id: number;
  name: string;
  description?: string;
  location: string;
  size: number;
  sizeUnit: string;
  cropsCount?: number;
  livestockCount?: number;
  workersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  FARM_OWNER = 'FARM_OWNER', 
  SUPERVISOR = 'SUPERVISOR',
  WORKER = 'WORKER'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  farmId?: number;
  farmName?: string;
  mustChangePassword?: boolean;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  password: string;
  farmId?: number; // Farm ID for supervisors and workers
  mustChangePassword?: boolean;
}