package com.smartfarm360.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkerStatsResponse {
    private Long workerId;
    private Integer totalTasks;
    private Integer completedTasks;
    private Integer pendingTasks;
    private Integer inProgressTasks;
    private Double completionRate; // Percentage
    private Integer totalAttendanceDays;
    private Integer presentDays;
    private Double attendanceRate; // Percentage
    private String lastActive; // Last attendance date or task update
    private Double averageTaskCompletionTime; // In hours
}
