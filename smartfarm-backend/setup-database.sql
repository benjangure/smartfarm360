-- SmartFarm360 Database Setup Script
-- Run this in MySQL Workbench or MySQL command line

-- 1. Create the database
CREATE DATABASE IF NOT EXISTS smartfarm360_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. Use the database
USE smartfarm360_db;

-- 3. Show confirmation
SELECT 'SmartFarm360 database created successfully!' as message;

-- 4. Create supervisor farm assignments junction table
CREATE TABLE IF NOT EXISTS supervisor_farm_assignments (
    supervisor_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    PRIMARY KEY (supervisor_id, farm_id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    INDEX idx_supervisor_id (supervisor_id),
    INDEX idx_farm_id (farm_id)
);

-- 5. Create messages table for hierarchical messaging system
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    message_type ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') DEFAULT 'TEXT',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_created_at (created_at),
    INDEX idx_conversation (sender_id, recipient_id)
);

-- 6. Create tasks table for task management system
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
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

-- 7. Show database info
SHOW DATABASES LIKE 'smartfarm360_db';

-- Optional: Create a dedicated user (recommended for production)
-- Uncomment the lines below if you want to create a dedicated database user

-- CREATE USER IF NOT EXISTS 'smartfarm_user'@'localhost' IDENTIFIED BY 'SmartFarm2024!';
-- GRANT ALL PRIVILEGES ON smartfarm360_db.* TO 'smartfarm_user'@'localhost';
-- FLUSH PRIVILEGES;
-- SELECT 'Database user created successfully!' as message;