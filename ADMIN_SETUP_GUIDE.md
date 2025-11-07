# SmartFarm360 - System Admin Setup Guide

## Overview
This guide explains how to create the initial System Admin account for SmartFarm360. The System Admin is the highest-level user who can manage the entire platform.

## Prerequisites
- MySQL database running
- Database `smartfarm360_db` created (run `setup-database.sql`)
- Backend application configured and ready to run

## Method 1: Direct Database Insert (Recommended for Initial Setup)

### Step 1: Generate Password Hash
The system uses BCrypt for password hashing. You need to generate a BCrypt hash for your admin password.

**Option A: Use an online BCrypt generator**
1. Go to: https://bcrypt-generator.com/
2. Enter your desired password (e.g., `Admin@2024`)
3. Use rounds: 10 (default)
4. Copy the generated hash

**Option B: Use the backend application**
Create a temporary endpoint or use the registration flow to generate a hash, then copy it.

### Step 2: Insert Admin User into Database
Run this SQL script in MySQL Workbench or command line:

```sql
USE smartfarm360_db;

-- Insert System Admin user
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
) VALUES (
    'admin',                                    -- Username
    'admin@smartfarm360.com',                   -- Email
    '$2a$10$YOUR_BCRYPT_HASH_HERE',            -- Replace with your BCrypt hash
    'System',                                   -- First name
    'Administrator',                            -- Last name
    '+1234567890',                              -- Phone number
    'SYSTEM_ADMIN',                             -- Role
    TRUE,                                       -- Active
    TRUE,                                       -- Email verified
    FALSE,                                      -- Must change password
    NOW(),                                      -- Created at
    NOW()                                       -- Updated at
);

-- Verify the admin was created
SELECT id, username, email, role, is_active FROM users WHERE role = 'SYSTEM_ADMIN';
```

### Step 3: Login
1. Start the backend: `run-backend.bat`
2. Start the frontend: `cd smartfarm-frontend && npm start`
3. Navigate to: http://localhost:4200/login
4. Login with:
   - Username: `admin`
   - Password: (the password you used to generate the BCrypt hash)

---

## Method 2: SQL Script with Pre-Generated Hash

For quick setup, use this script with a default password that you should change immediately:

```sql
USE smartfarm360_db;

-- Create admin with password: Admin@2024
-- IMPORTANT: Change this password immediately after first login!
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
) VALUES (
    'admin',
    'admin@smartfarm360.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Password: Admin@2024
    'System',
    'Administrator',
    '+1234567890',
    'SYSTEM_ADMIN',
    TRUE,
    TRUE,
    TRUE,  -- Force password change on first login
    NOW(),
    NOW()
);

SELECT 'System Admin created successfully!' as message;
SELECT 'Username: admin' as login_info;
SELECT 'Password: Admin@2024' as login_info;
SELECT 'IMPORTANT: Change password immediately after first login!' as warning;
```

Save this as `create-admin.sql` and run it.

---

## Method 3: Using Application Registration (Not Recommended)

While the system has a registration endpoint, it's not designed for creating System Admins directly. This method requires code modification and is not recommended for production.

---

## System Admin Capabilities

Once logged in as System Admin, you can:

### User Management
- View all users in the system
- Create Farm Owners, Supervisors, and Workers
- Approve/reject farm owner applications
- Deactivate user accounts

### Farm Management
- View all farms across the platform
- Access farm details and statistics
- Monitor farm activities

### Messaging
- Communicate with all Farm Owners
- Receive messages from Farm Owners

### Reports & Analytics
- View system-wide statistics
- Access farm owner reports
- Monitor platform usage

### System Configuration
- Test email functionality
- View system configuration
- Access admin-only endpoints

---

## Security Best Practices

1. **Strong Password**: Use a strong, unique password for the admin account
   - Minimum 8 characters
   - Include uppercase, lowercase, numbers, and special characters
   - Example: `SmartF@rm2024!Admin`

2. **Change Default Password**: If using Method 2, change the password immediately after first login

3. **Secure Email**: Use a real, secure email address for the admin account

4. **Limit Access**: Only create admin accounts for trusted personnel

5. **Regular Updates**: Periodically update the admin password

6. **Monitor Activity**: Regularly review system logs and user activities

---

## Troubleshooting

### Cannot Login
- Verify the user exists: `SELECT * FROM users WHERE username = 'admin';`
- Check if account is active: `is_active` should be `TRUE`
- Verify email is confirmed: `email_verified` should be `TRUE`
- Check password hash is correct

### Password Not Working
- Ensure you're using the correct password that matches the BCrypt hash
- BCrypt hashes are case-sensitive
- Try regenerating the hash

### Role Not Working
- Verify role is exactly `SYSTEM_ADMIN` (case-sensitive)
- Check: `SELECT role FROM users WHERE username = 'admin';`

---

## Next Steps After Admin Setup

1. **Login as Admin**
2. **Change Password** (if using default)
3. **Update Profile** with real contact information
4. **Review Applications** from farm owners
5. **Configure Email Settings** (if not already done)
6. **Create Additional Users** as needed

---

## For GitHub Repository

When uploading to GitHub:
- **DO NOT** include the admin password in any files
- **DO NOT** commit `application.yml` with real credentials
- **DO** include this setup guide
- **DO** include a `.env.example` file with placeholder values
- **DO** add sensitive files to `.gitignore`

---

## Support

For issues or questions:
1. Check the application logs: `smartfarm-backend/logs/`
2. Review database status: Run `check-database-status.sql`
3. Verify backend is running: http://localhost:8080/actuator/health
4. Check frontend console for errors

---

**Last Updated**: November 2024
**Version**: 1.0
