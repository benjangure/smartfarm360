# SmartFarm360 Database Setup Guide

## Prerequisites

1. **MySQL Server** installed and running
2. **MySQL Workbench** or command line access

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE smartfarm360_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Create MySQL User (Optional - for production)

```sql
CREATE USER 'smartfarm_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON smartfarm360_db.* TO 'smartfarm_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Update Application Configuration

Update `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smartfarm360_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: root  # or smartfarm_user
    password: your_mysql_password
```

## Configuration Changes Made

### 1. Database Persistence
- Changed `ddl-auto` from `create-drop` to `update`
- This ensures data persists between application restarts

### 2. Improved Data Initialization
- Enhanced `DataInitializer` to check for existing users before creating
- Added better logging for demo credentials
- Improved error handling

## Demo Users

The application automatically creates these demo users on first startup:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| System Admin | `sysadmin` | `admin123` | ngurebenjamin5@gmail.com |
| Farm Owner | `farmowner` | `owner123` | farmowner@demo.com |
| Supervisor | `supervisor` | `supervisor123` | supervisor@demo.com |
| Worker | `worker` | `worker123` | worker@demo.com |

## Troubleshooting

### 1. Connection Issues
- Ensure MySQL is running
- Check username/password in application.yml
- Verify database exists

### 2. Data Not Persisting
- Check that `ddl-auto: update` is set (not `create-drop`)
- Verify MySQL user has proper permissions

### 3. Demo Users Not Created
- Check application logs for DataInitializer messages
- Ensure database connection is working
- Look for any constraint violations in logs

## Production Considerations

1. **Change Default Passwords**: Update all demo user passwords
2. **Use Environment Variables**: Store sensitive data in environment variables
3. **Database User**: Create dedicated MySQL user with limited privileges
4. **Backup Strategy**: Implement regular database backups
5. **SSL**: Enable SSL for database connections in production

## Environment Variables (Production)

```bash
export DB_URL=jdbc:mysql://localhost:3306/smartfarm360_db
export DB_USERNAME=smartfarm_user
export DB_PASSWORD=secure_password
export JWT_SECRET=your_jwt_secret_key
export ADMIN_EMAIL=your_admin_email@company.com
```

Then update application.yml to use these variables:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```