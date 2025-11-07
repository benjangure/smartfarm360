-- SmartFarm360 - Create System Administrator
-- This script creates the initial System Admin account
-- 
-- Default Credentials:
--   Username: admin
--   Password: Admin@2024
--
-- IMPORTANT: Change the password immediately after first login!

USE smartfarm360_db;

-- Check if admin already exists
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'WARNING: System Admin already exists!'
        ELSE 'No existing admin found. Creating new admin...'
    END as status
FROM users 
WHERE role = 'SYSTEM_ADMIN';

-- Create System Admin user
-- Password is BCrypt hash of: Admin@2024
INSERT INTO users (
    username,
    email,
    password,
    first_name,
    last_name,
    phone_number,
    role,
    is_active,
    email_verified,
    must_change_password,
    created_at,
    updated_at
) 
SELECT 
    'admin',
    'admin@smartfarm360.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'System',
    'Administrator',
    '+1234567890',
    'SYSTEM_ADMIN',
    TRUE,
    TRUE,
    TRUE,  -- Force password change on first login
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin' OR role = 'SYSTEM_ADMIN'
);

-- Display results
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: System Admin created!'
        ELSE 'INFO: Admin already exists, no changes made.'
    END as result
FROM users 
WHERE username = 'admin';

-- Show admin details (without password)
SELECT 
    id,
    username,
    email,
    CONCAT(first_name, ' ', last_name) as full_name,
    role,
    is_active,
    email_verified,
    must_change_password,
    created_at
FROM users 
WHERE role = 'SYSTEM_ADMIN';

-- Display login instructions
SELECT '========================================' as '';
SELECT 'SYSTEM ADMIN LOGIN CREDENTIALS' as '';
SELECT '========================================' as '';
SELECT 'Username: admin' as '';
SELECT 'Password: Admin@2024' as '';
SELECT '========================================' as '';
SELECT 'IMPORTANT SECURITY NOTICE:' as '';
SELECT 'Change this password immediately after first login!' as '';
SELECT 'Go to Profile > Change Password' as '';
SELECT '========================================' as '';
