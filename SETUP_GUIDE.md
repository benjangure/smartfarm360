# SmartFarm360 - Complete Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Creating System Administrator](#creating-system-administrator)
6. [First Login](#first-login)
7. [Creating Demo Data](#creating-demo-data)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Java Development Kit (JDK) 17+**
   - Download from: https://www.oracle.com/java/technologies/downloads/
   - Verify installation: `java -version`

2. **Node.js 18+ and npm**
   - Download from: https://nodejs.org/
   - Verify installation: `node -v` and `npm -v`

3. **MySQL 8.0+**
   - Download from: https://dev.mysql.com/downloads/
   - Verify installation: `mysql --version`

4. **Maven 3.8+** (or use included Maven wrapper)
   - Download from: https://maven.apache.org/download.cgi
   - Verify installation: `mvn -version`

5. **Git**
   - Download from: https://git-scm.com/downloads
   - Verify installation: `git --version`

## Database Setup

### Step 1: Start MySQL Server

**Windows:**
```bash
# Start MySQL service
net start MySQL80
```

**Mac/Linux:**
```bash
# Start MySQL service
sudo systemctl start mysql
# or
sudo service mysql start
```

### Step 2: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE smartfarm360;

# Verify database creation
SHOW DATABASES;

# Exit MySQL
exit;
```

### Step 3: Run Database Schema

```bash
# Navigate to backend directory
cd smartfarm-backend

# Run setup script
mysql -u root -p smartfarm360 < setup-database.sql

# Verify tables were created
mysql -u root -p smartfarm360 -e "SHOW TABLES;"
```

Expected tables:
- users
- farms
- supervisor_farms
- tasks
- attendance
- farm_owner_applications
- messages
- chat_messages
- crops
- livestock

## Backend Setup

### Step 1: Configure Database Connection

Edit `smartfarm-backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smartfarm360?useSSL=false&serverTimezone=UTC
    username: root  # Your MySQL username
    password: your_password  # Your MySQL password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### Step 2: Configure Email (Optional but Recommended)

For Gmail:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com
    password: your-app-password  # Generate from Google Account settings
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
            required: true

smartfarm:
  admin:
    email: admin@smartfarm360.com  # Admin notification email
```

**Gmail App Password Setup:**
1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not enabled)
3. App passwords → Generate new app password
4. Use generated password in configuration

### Step 3: Build Backend

```bash
cd smartfarm-backend

# Clean and build
mvn clean install

# Or use Maven wrapper (if mvnw is available)
./mvnw clean install  # Mac/Linux
mvnw.cmd clean install  # Windows
```

### Step 4: Run Backend

```bash
# Run Spring Boot application
mvn spring-boot:run

# Or use Maven wrapper
./mvnw spring-boot:run  # Mac/Linux
mvnw.cmd spring-boot:run  # Windows

# Or run the JAR file
java -jar target/smartfarm-backend-0.0.1-SNAPSHOT.jar
```

Backend should start on: `http://localhost:8080`

**Verify backend is running:**
```bash
curl http://localhost:8080/api/test
```

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd smartfarm-frontend

# Install npm packages
npm install

# If you encounter errors, try:
npm install --legacy-peer-deps
```

### Step 2: Configure API URL

Edit `smartfarm-frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

### Step 3: Run Frontend

```bash
# Start development server
npm start

# Or explicitly
ng serve
```

Frontend should start on: `http://localhost:4200`

**Verify frontend is running:**
Open browser and navigate to `http://localhost:4200`

## Creating System Administrator

### Method 1: Automatic (Default Admin)

The system automatically creates a default admin on first run via `DataInitializer.java`.

**Default Credentials:**
- **Username:** `sysadmin`
- **Password:** `admin123`
- **Email:** `admin@smartfarm360.com`

⚠️ **IMPORTANT:** Change this password immediately after first login!

### Method 2: Manual Database Insert

If you want to create a custom admin:

#### Step 1: Generate Password Hash

Use an online BCrypt generator or Spring Security:
- Go to: https://bcrypt-generator.com/
- Enter your desired password
- Copy the BCrypt hash

#### Step 2: Insert Admin User

```sql
-- Login to MySQL
mysql -u root -p smartfarm360

-- Insert admin user
INSERT INTO users (
    username, 
    email, 
    password, 
    first_name, 
    last_name, 
    phone_number, 
    role, 
    is_active, 
    must_change_password,
    created_at, 
    updated_at
) VALUES (
    'admin',  -- Your desired username
    'admin@yourdomain.com',  -- Your email
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- BCrypt hash of "admin123"
    'System',
    'Administrator',
    '+1234567890',
    'SYSTEM_ADMIN',
    true,
    false,
    NOW(),
    NOW()
);

-- Verify admin was created
SELECT id, username, email, role FROM users WHERE role = 'SYSTEM_ADMIN';
```

### Method 3: Using API (After System is Running)

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123",
    "firstName": "System",
    "lastName": "Administrator",
    "phoneNumber": "+1234567890",
    "role": "SYSTEM_ADMIN"
  }'
```

## First Login

### Step 1: Access Application

Open browser and navigate to: `http://localhost:4200`

### Step 2: Login as System Admin

- **Username:** `sysadmin` (or your custom username)
- **Password:** `admin123` (or your custom password)

### Step 3: Change Password (Recommended)

1. Click on user profile
2. Select "Change Password"
3. Enter current password
4. Enter new secure password
5. Confirm new password

## Creating Demo Data

### Option 1: Through Application UI

#### Create Farm Owner:
1. Logout from admin account
2. Go to "Apply as Farm Owner" page
3. Fill in application form
4. Login as admin
5. Go to "Applications" page
6. Approve the application
7. Farm owner receives email with credentials

#### Create Farm:
1. Login as farm owner
2. Go to "My Farms"
3. Click "Add Farm"
4. Fill in farm details
5. Save

#### Create Supervisor:
1. Login as farm owner
2. Go to "Add Supervisor"
3. Fill in supervisor details
4. Save
5. Go to "Supervisor Assignments"
6. Assign supervisor to a farm

#### Create Worker:
1. Login as supervisor
2. Go to "Add Worker"
3. Fill in worker details
4. Save (worker is automatically assigned to supervisor's farm)

### Option 2: Using SQL Script

```sql
-- Create Farm Owner
INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, is_active, must_change_password, created_at, updated_at)
VALUES ('john.owner', 'owner@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Owner', '1234567890', 'FARM_OWNER', true, false, NOW(), NOW());

SET @owner_id = LAST_INSERT_ID();

-- Create Farm
INSERT INTO farms (name, location, size, type, owner_id, created_at, updated_at)
VALUES ('Green Valley Farm', 'Nairobi, Kenya', '50 acres', 'Mixed Farming', @owner_id, NOW(), NOW());

SET @farm_id = LAST_INSERT_ID();

-- Create Supervisor
INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, is_active, must_change_password, assigned_farm_id, created_at, updated_at)
VALUES ('jane.supervisor', 'supervisor@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane', 'Supervisor', '0987654321', 'SUPERVISOR', true, false, @farm_id, NOW(), NOW());

SET @supervisor_id = LAST_INSERT_ID();

-- Link Supervisor to Farm
INSERT INTO supervisor_farms (supervisor_id, farm_id) VALUES (@supervisor_id, @farm_id);

-- Create Worker
INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, is_active, must_change_password, assigned_farm_id, created_at, updated_at)
VALUES ('bob.worker', 'worker@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bob', 'Worker', '1122334455', 'WORKER', true, false, @farm_id, NOW(), NOW());
```

**Note:** All demo users have password: `admin123`

## Troubleshooting

### Backend Won't Start

**Issue:** Port 8080 already in use
```bash
# Windows: Find and kill process
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux: Find and kill process
lsof -i :8080
kill -9 <PID>
```

**Issue:** Database connection failed
- Verify MySQL is running
- Check credentials in `application.yml`
- Ensure database `smartfarm360` exists

### Frontend Won't Start

**Issue:** Port 4200 already in use
```bash
# Kill process on port 4200
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :4200
kill -9 <PID>
```

**Issue:** npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install --legacy-peer-deps
```

### Can't Login

**Issue:** Invalid credentials
- Verify user exists in database
- Check password is correct
- Ensure user is active (`is_active = true`)

**Issue:** JWT token error
- Clear browser localStorage
- Check JWT secret in `application.yml`
- Verify backend is running

### Email Not Sending

**Issue:** SMTP authentication failed
- Verify email credentials
- For Gmail, use app-specific password
- Check firewall settings

## Next Steps

After successful setup:

1. ✅ Login as system admin
2. ✅ Change default password
3. ✅ Create farm owners (or approve applications)
4. ✅ Farm owners create farms
5. ✅ Farm owners create and assign supervisors
6. ✅ Supervisors create workers
7. ✅ Start using the system!

## Support

If you encounter issues:
1. Check this guide thoroughly
2. Review error logs (backend console and browser console)
3. Check GitHub issues
4. Contact: ngurebenjamin5@gmail.com

---

**Happy Farming! 🌾**
