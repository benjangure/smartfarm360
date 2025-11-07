export interface Attendance {
  id?: number;
  userId: number;
  checkInTime?: string;
  checkOutTime?: string;
  date: string;
  totalHours?: number;
  status: AttendanceStatus;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  faceImageData?: string; // Base64 encoded face image
  createdAt?: string;
  updatedAt?: string;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EARLY = 'EARLY',
  ON_TIME = 'ON_TIME'
}

export interface AttendanceRequest {
  latitude?: number;
  longitude?: number;
  notes?: string;
  location?: string;
  faceImageData?: string;
}

export interface AttendanceResponse {
  id: number;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: string;
  status: string;
  message: string;
  faceImageData?: string;
}