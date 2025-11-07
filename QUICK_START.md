# SmartFarm360 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Check
```bash
java -version    # Need 17+
mvn -version     # Need 3.8+
node -v          # Need 18+
mysql --version  # Need 8.0+
```

### 1. Clone & Setup (2 minutes)
```bash
# Clone repository
git clone https://github.com/benjangure/smartfarm360.git
cd smartfarm360

# Setup database
mysql -u root -p < smartfarm-backend/setup-database.sql
mysql -u root -p < create-admin.sql
```

### 2. Configure Backend (1 minute)
```bash
cd smartfarm-backend/src/main/resources
copy application.yml.example application.yml
```

Edit `application.yml`:
- Line 6: Add your MySQL password
- Line 18-19: Add your Gmail and app password
- Line 31: Add a secure JWT secret

### 3. Install Frontend (1 minute)
```bash
cd smartfarm-frontend
npm install
```

### 4. Run Application (1 minute)
```bash
# Terminal 1: Backend
cd smartfarm-backend
mvn spring-boot:run

# Terminal 2: Frontend
cd smartfarm-frontend
npm start
```

### 5. Login
Open http://localhost:4200
- Username: `admin`
- Password: `Admin@2024`

**Done!** 🎉

---

## Common Commands

### Backend
```bash
# Run
mvn spring-boot:run

# Build
mvn clean package

# Test
mvn test
```

### Frontend
```bash
# Run dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Database
```bash
# Login
mysql -u root -p

# Backup
mysqldump -u root -p smartfarm360_db > backup.sql

# Restore
mysql -u root -p smartfarm360_db < backup.sql
```

---

## Troubleshooting

### Backend won't start?
```bash
# Check if port 8080 is free
netstat -ano | findstr :8080

# Check MySQL is running
mysql -u root -p
```

### Frontend won't start?
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

### Can't login?
```sql
-- Reset admin password
USE smartfarm360_db;
UPDATE users 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE username = 'admin';
-- Password reset to: Admin@2024
```

---

## Need More Help?

- **Full Setup**: See `SETUP_INSTRUCTIONS.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Admin Guide**: See `ADMIN_SETUP_GUIDE.md`
- **Issues**: https://github.com/benjangure/smartfarm360/issues

---

**Happy Farming! 🌾**
