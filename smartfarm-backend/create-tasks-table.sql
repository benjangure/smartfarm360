-- Create tasks table for task management system
USE smartfarm360_db;

CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'NOT_DONE', 'TO_BE_DONE_LATER', 'CANCELLED') DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    assigned_to_id BIGINT NOT NULL,
    created_by_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    due_date DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    estimated_hours INT,
    actual_hours INT,
    completion_notes TEXT,
    reason_for_delay TEXT,
    estimated_completion_date DATETIME,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    INDEX idx_assigned_to (assigned_to_id),
    INDEX idx_created_by (created_by_id),
    INDEX idx_farm_id (farm_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- Show confirmation
SELECT 'Tasks table created successfully!' as message;