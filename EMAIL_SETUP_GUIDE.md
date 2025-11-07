# Email Setup Guide for SmartFarm360

## Quick Setup for Testing

### 1. Gmail App Password Setup
To use your Gmail account (`ngurebenjamin5@gmail.com`) for sending emails:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security → 2-Step Verification (enable if not already enabled)
3. Go to Security → App passwords
4. Generate a new app password for "SmartFarm360"
5. Copy the 16-character app password

### 2. Configure Email Settings

**Option A: Environment Variables (Recommended)**
Set these environment variables before starting the application:
```bash
set MAIL_USERNAME=ngurebenjamin5@gmail.com
set MAIL_PASSWORD=your-16-character-app-password
set ADMIN_EMAIL=ngurebenjamin5@gmail.com
```

**Option B: Update application.yml directly**
Edit `smartfarm-backend/src/main/resources/application.yml`:
```yaml
spring:
  mail:
    username: ngurebenjamin5@gmail.com
    password: your-16-character-app-password
```

### 3. Test Email Functionality

After starting the application:

1. **Login as System Admin:**
   - Username: `sysadmin`
   - Password: `admin123`
   - Email: `ngurebenjamin5@gmail.com`

2. **Test Email Endpoint:**
   - POST to: `http://localhost:8080/api/test/email`
   - This will send a test notification to your email

3. **Test Application Flow:**
   - Go to the landing page
   - Fill out the farm owner application form
   - You should receive an email notification at `ngurebenjamin5@gmail.com`

### 4. Demo User Credentials

If you're getting "Bad credentials" error, try these updated credentials:

- **System Admin:** `sysadmin` / `admin123`
- **Farm Owner:** `farmowner` / `owner123`
- **Supervisor:** `supervisor` / `supervisor123`
- **Worker:** `worker` / `worker123`

### 5. Reset Database (if needed)

If login still doesn't work, you may need to reset the database:
1. Stop the application
2. Drop the database: `DROP DATABASE smartfarm360_db;`
3. Create it again: `CREATE DATABASE smartfarm360_db;`
4. Restart the application (it will recreate tables and demo users)

### 6. Other Email Providers for Testing

For other users, you can use:
- **Yopmail:** Create temporary emails at https://yopmail.com/
- **10MinuteMail:** https://10minutemail.com/
- **Guerrilla Mail:** https://www.guerrillamail.com/

## Email Flow Summary

1. **Farm Owner Application:** User fills form → You get notification email
2. **Application Approval:** You approve → Farm owner gets credentials email
3. **Application Rejection:** You reject → Farm owner gets rejection email

All admin notifications will go to: `ngurebenjamin5@gmail.com`