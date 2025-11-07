# SmartFarm360 - Complete Setup Instructions

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Setup](#frontend-setup)
6. [Creating System Admin](#creating-system-admin)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Java Development Kit (JDK)**: Version 17 or higher
  - Download: https://www.oracle.com/java/technologies/downloads/
  - Verify: `java -version`

- **Maven**: Version 3.8 or higher
  - Download: https://maven.apache.org/download.cgi
  - Verify: `mvn -version`

- **Node.js**: Version 18 or higher
  - Download: https://nodejs.org/
  - Verify: `node -v`

- **npm**: Version 9 or higher (comes with Node.js)
  - Verify: `npm -v`

- **MySQL**: Version 8.0 or higher
  - Download: https://dev.mysql.com/downloads/mysql/
  - Verify: `mysql --version`

- **Git**: Latest version
  - Download: https://git-scm.com/downloads
  - Verify: `git --version`

### Optional but Recommended
- **MySQL Workbench**: For database management
- **Postman**: For API testing
- **VS Code** or **IntelliJ IDEA**: For code editing

---

## Installation Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/benjangure/smartfarm360.git

# Navigate to project directory
cd smartfarm360
```

---

## Database Setup

### 1. Start MySQL Server

**Windows:**
```bash
# MySQL should start automatically, or use:
net start MySQL80
```

**Linux/Mac:**
```bash
sudo systemctl start mysql
# or
sudo service mysql start
```

### 2. Login to MySQL

```bash
mysql -u root -p
# Enter your MySQL root password when prompted
```

### 3. Create Database

**Option A: Using SQL File (Recommended)**
```bash
# Exit MySQL first (type 'exit')
mysql -u root -p < smartfarm-backend/setup-database.sql
```

**Option B: Manual Creation**
```sql
-- In MySQL prompt
CREATE DATABASE IF NOT EXISTS smartfarm360_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE smartfarm360_db;

-- Tables will be created automatically by Spring Boot
```

### 4. Verify Database Creation

```sql
SHOW DATABASES LIKE 'smartfarm360_db';
USE smartfarm360_db;
SHOW TABLES;
```

---

## Backend Configuration

### 1. Navigate to Backend Directory

```bash
cd smartfarm-backend/src/main/resources
```

### 2. Create Configuration File

```bash
# Copy the example configuration
copy application.yml.example application.yml
# On Linux/Mac: cp application.yml.example application.yml
```

### 3. Edit Configuration File

Open `application.yml` in a text editor and configure:

#### A. Database Configuration
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smartfarm360_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root
    password: YOUR_MYSQL_PASSWORD_HERE  # ← Change this
```

#### B. Email Configuration (Gmail)

**First, get a Gmail App Password:**
1. Go to your Google Account: https://myaccount.google.com/
2. Security → 2-Step Verification (enable if not enabled)
3. Security → App passwords
4. Generate new app password for "Mail"
5. Copy the 16-character password

**Then configure:**
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your.email@gmail.com        # ← Your Gmail
    password: xxxx xxxx xxxx xxxx          # ← Your App Password
```

#### C. JWT Secret (Important for Security)
```yaml
jwt:
  secret: YOUR_SECURE_RANDOM_STRING_HERE  # ← Change this to a long random string
```

Generate a secure secret:
```bash
# Option 1: Use online generator
# Visit: https://www.grc.com/passwords.htm

# Option 2: Use command line (Linux/Mac)
openssl rand -base64 64

# Option 3: Use PowerShell (Windows)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### D. Admin Email
```yaml
smartfarm:
  admin:
    email: your.email@gmail.com  # ← Your email for admin notifications
```

### 4. Save the Configuration File

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd smartfarm-frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will take a few minutes to download all required packages.

### 3. Verify Installation

```bash
# Check if node_modules folder was created
dir node_modules  # Windows
ls node_modules   # Linux/Mac
```

---

## Creating System Admin

### 1. Navigate to Project Root

```bash
cd ..  # Go back to project root
```

### 2. Run Admin Creation Script

```bash
mysql -u root -p < create-admin.sql
```

This creates an admin account with:
- **Username**: `admin`
- **Password**: `Admin@2024`
- ⚠️ **IMPORTANT**: Change this password immediately after first login!

### 3. Verify Admin Creation

```bash
mysql -u root -p
```

```sql
USE smartfarm360_db;
SELECT username, email, role FROM users WHERE role = 'SYSTEM_ADMIN';
```

You should see the admin user listed.

---

## Running the Application

### 1. Start Backend Server

**Option A: Using Maven (Recommended)**
```bash
cd smartfarm-backend
mvn spring-boot:run
```

**Option B: Using Batch File (Windows)**
```bash
run-backend.bat
```

**Wait for:**
```
Started SmartFarm360Application in X.XXX seconds
```

Backend will run on: **http://localhost:8080**

### 2. Start Frontend Server (New Terminal)

Open a **new terminal/command prompt**:

```bash
cd smartfarm-frontend
npm start
```

**Wait for:**
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200 **
```

Frontend will run on: **http://localhost:4200**

### 3. Access the Application

Open your browser and go to:
```
http://localhost:4200
```

### 4. Login as Admin

- **Username**: `admin`
- **Password**: `Admin@2024`

**First thing after login**: Go to Profile → Change Password

---

## Post-Installation Steps

### 1. Change Admin Password

1. Login as admin
2. Click on your profile (top right)
3. Select "Change Password"
4. Enter current password: `Admin@2024`
5. Enter new secure password
6. Save changes

### 2. Update Admin Profile

1. Go to Profile
2. Update your real information:
   - First Name
   - Last Name
   - Email
   - Phone Number
3. Save changes

### 3. Test Email Functionality

1. Go to Dashboard
2. Look for "Test Email" or similar option
3. Send a test email to verify configuration

### 4. Create Your First Farm Owner

**Option A: Approve Application**
1. Have someone submit a farm owner application
2. Login as admin
3. Go to "Applications" or "Farm Owners"
4. Review and approve the application

**Option B: Direct Creation**
1. Login as admin
2. Go to "Users" → "Create User"
3. Fill in details
4. Select role: "Farm Owner"
5. Submit

---

## Troubleshooting

### Backend Won't Start

**Problem**: Port 8080 already in use
```bash
# Windows: Find and kill process
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F

# Linux/Mac: Find and kill process
lsof -i :8080
kill -9 <PID>
```

**Problem**: Database connection failed
- Verify MySQL is running
- Check username/password in `application.yml`
- Ensure database exists: `SHOW DATABASES;`

**Problem**: Email not sending
- Verify Gmail App Password (not regular password)
- Check if 2-Step Verification is enabled
- Ensure "Less secure app access" is OFF (use App Password instead)

### Frontend Won't Start

**Problem**: Port 4200 already in use
```bash
# Kill the process using port 4200
# Windows:
netstat -ano | findstr :4200
taskkill /PID <PID_NUMBER> /F

# Linux/Mac:
lsof -i :4200
kill -9 <PID>
```

**Problem**: npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s node_modules & del package-lock.json  # Windows

# Reinstall
npm install
```

**Problem**: Angular CLI not found
```bash
# Install Angular CLI globally
npm install -g @angular/cli
```

### Database Issues

**Problem**: Tables not created
- Spring Boot creates tables automatically
- Check `application.yml`: `ddl-auto: update`
- Check backend logs for errors

**Problem**: Cannot login
```sql
-- Check if user exists
SELECT * FROM users WHERE username = 'admin';

-- Check if user is active
SELECT username, is_active, email_verified FROM users WHERE username = 'admin';

-- Reset admin password if needed
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    must_change_password = TRUE
WHERE username = 'admin';
-- Password reset to: Admin@2024
```

### Email Issues

**Problem**: Emails not being sent

1. **Check Gmail Settings**:
   - 2-Step Verification enabled
   - App Password generated
   - Using App Password (not regular password)

2. **Check Backend Logs**:
   ```bash
   # Look for email-related errors in console
   ```

3. **Test SMTP Connection**:
   ```bash
   # Use telnet to test SMTP
   telnet smtp.gmail.com 587
   ```

4. **Verify Configuration**:
   ```yaml
   spring:
     mail:
       host: smtp.gmail.com
       port: 587
       username: your.email@gmail.com
       password: your-app-password
       properties:
         mail:
           smtp:
             auth: true
             starttls:
               enable: true
   ```

---

## API Documentation

Once backend is running, access Swagger UI:
```
http://localhost:8080/swagger-ui.html
```

This provides interactive API documentation and testing.

---

## Default Ports

- **Backend**: http://localhost:8080
- **Frontend**: http://localhost:4200
- **MySQL**: localhost:3306
- **Swagger UI**: http://localhost:8080/swagger-ui.html

---

## Security Notes

### Important Security Practices

1. **Change Default Passwords**:
   - Admin password after first login
   - MySQL root password

2. **Secure JWT Secret**:
   - Use a long, random string
   - Never commit to version control

3. **Email Credentials**:
   - Use App Passwords, not regular passwords
   - Never commit to version control

4. **Database Credentials**:
   - Use strong passwords
   - Never commit to version control

5. **Production Deployment**:
   - Use environment variables
   - Enable HTTPS
   - Use proper firewall rules
   - Regular security updates

---

## Next Steps

After successful setup:

1. ✅ Change admin password
2. ✅ Update admin profile
3. ✅ Test email functionality
4. ✅ Create your first farm owner
5. ✅ Explore the system features
6. ✅ Read the user documentation

---

## Getting Help

### Documentation
- **Admin Guide**: See `ADMIN_SETUP_GUIDE.md`
- **Email Setup**: See `EMAIL_SETUP_GUIDE.md` (if available)
- **README**: See `README.md`

### Support
- **GitHub Issues**: https://github.com/benjangure/smartfarm360/issues
- **Email**: ngurebenjamin5@gmail.com

---

## System Requirements Summary

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Java | JDK 17 | JDK 17+ |
| Maven | 3.8 | 3.9+ |
| Node.js | 18.x | 20.x |
| npm | 9.x | 10.x |
| MySQL | 8.0 | 8.0+ |
| RAM | 4 GB | 8 GB+ |
| Disk Space | 2 GB | 5 GB+ |

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Author**: Benjamin Ngure
