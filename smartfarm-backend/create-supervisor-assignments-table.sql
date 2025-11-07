-- Create the supervisor_farm_assignments junction table
-- Run this SQL script in your MySQL database

USE smartfarm360_db;

-- Create the junction table for supervisor farm assignments
CREATE TABLE IF NOT EXISTS supervisor_farm_assignments (
    supervisor_id BIGINT NOT NULL,
    farm_id BIGINT NOT NULL,
    PRIMARY KEY (supervisor_id, farm_id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    INDEX idx_supervisor_id (supervisor_id),
    INDEX idx_farm_id (farm_id)
);

-- Verify the table was created
DESCRIBE supervisor_farm_assignments;

-- Show existing tables to confirm
SHOW TABLES LIKE '%supervisor%';

SELECT 'Supervisor farm assignments table created successfully!' as message;