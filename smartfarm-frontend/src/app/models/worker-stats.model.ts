export interface WorkerStats {
  workerId: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionRate: number; // Percentage
  totalAttendanceDays: number;
  presentDays: number;
  attendanceRate: number; // Percentage
  lastActive: string;
  averageTaskCompletionTime: number; // In hours
}
