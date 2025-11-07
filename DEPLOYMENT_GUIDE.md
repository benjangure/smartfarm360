# SmartFarm360 - Deployment Guide

## 🚀 Deployment Options

This guide covers deploying SmartFarm360 to production environments.

---

## Table of Contents
1. [Local Development](#local-development)
2. [Production Deployment](#production-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Environment Variables](#environment-variables)
6. [Security Checklist](#security-checklist)

---

## Local Development

See `SETUP_INSTRUCTIONS.md` for complete local setup guide.

**Quick Start:**
```bash
# Backend
cd smartfarm-backend
mvn spring-boot:run

# Frontend (new terminal)
cd smartfarm-frontend
npm start
```

---

## Production Deployment

### Backend (Spring Boot)

#### 1. Build Production JAR

```bash
cd smartfarm-backend
mvn clean package -DskipTests
```

This creates: `target/smartfarm-backend-0.0.1-SNAPSHOT.jar`

#### 2. Configure Production Settings

Create `application-prod.yml`:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
  
  mail:
    host: ${MAIL_HOST}
    port: ${MAIL_PORT}
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
  
  jpa:
    hibernate:
      ddl-auto: validate  # Don't auto-update in production
    show-sql: false       # Disable SQL logging

server:
  port: ${PORT:8080}
  ssl:
    enabled: true         # Enable HTTPS
    key-store: ${SSL_KEYSTORE}
    key-store-password: ${SSL_PASSWORD}

jwt:
  secret: ${JWT_SECRET}
  expiration: 86400000

logging:
  level:
    com.smartfarm360: INFO
    org.springframework: WARN
```

#### 3. Run Production Server

```bash
java -jar target/smartfarm-backend-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --DATABASE_URL=jdbc:mysql://your-db-host:3306/smartfarm360_db \
  --DATABASE_USERNAME=your_username \
  --DATABASE_PASSWORD=your_password \
  --MAIL_USERNAME=your_email@gmail.com \
  --MAIL_PASSWORD=your_app_password \
  --JWT_SECRET=your_secure_jwt_secret
```

### Frontend (Angular)

#### 1. Build Production Bundle

```bash
cd smartfarm-frontend
npm run build --prod
```

This creates optimized files in `dist/smartfarm-frontend/`

#### 2. Serve with Web Server

**Option A: Nginx**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/smartfarm360/dist/smartfarm-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Option B: Apache**

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/smartfarm360/dist/smartfarm-frontend
    
    <Directory /var/www/smartfarm360/dist/smartfarm-frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    ProxyPass /api http://localhost:8080/api
    ProxyPassReverse /api http://localhost:8080/api
</VirtualHost>
```

---

## Cloud Deployment

### AWS Deployment

#### Backend (Elastic Beanstalk)

1. **Install AWS CLI**:
```bash
pip install awscli
aws configure
```

2. **Install EB CLI**:
```bash
pip install awsebcli
```

3. **Initialize EB**:
```bash
cd smartfarm-backend
eb init -p java-17 smartfarm360-backend
```

4. **Create Environment**:
```bash
eb create smartfarm360-prod
```

5. **Set Environment Variables**:
```bash
eb setenv DATABASE_URL=jdbc:mysql://your-rds-endpoint:3306/smartfarm360_db \
  DATABASE_USERNAME=admin \
  DATABASE_PASSWORD=your_password \
  MAIL_USERNAME=your_email@gmail.com \
  MAIL_PASSWORD=your_app_password \
  JWT_SECRET=your_jwt_secret
```

6. **Deploy**:
```bash
eb deploy
```

#### Frontend (S3 + CloudFront)

1. **Build**:
```bash
cd smartfarm-frontend
npm run build --prod
```

2. **Create S3 Bucket**:
```bash
aws s3 mb s3://smartfarm360-frontend
```

3. **Upload Files**:
```bash
aws s3 sync dist/smartfarm-frontend/ s3://smartfarm360-frontend/
```

4. **Configure S3 for Static Hosting**:
```bash
aws s3 website s3://smartfarm360-frontend/ \
  --index-document index.html \
  --error-document index.html
```

5. **Create CloudFront Distribution** (via AWS Console)

#### Database (RDS)

1. Create MySQL RDS instance
2. Configure security groups
3. Update backend DATABASE_URL

### Heroku Deployment

#### Backend

1. **Create Heroku App**:
```bash
heroku create smartfarm360-backend
```

2. **Add MySQL**:
```bash
heroku addons:create jawsdb:kitefin
```

3. **Set Config Vars**:
```bash
heroku config:set MAIL_USERNAME=your_email@gmail.com
heroku config:set MAIL_PASSWORD=your_app_password
heroku config:set JWT_SECRET=your_jwt_secret
```

4. **Deploy**:
```bash
git push heroku main
```

#### Frontend

1. **Create Heroku App**:
```bash
heroku create smartfarm360-frontend
```

2. **Add Buildpack**:
```bash
heroku buildpacks:add heroku/nodejs
```

3. **Deploy**:
```bash
git push heroku main
```

### DigitalOcean Deployment

#### Using Droplet

1. **Create Droplet** (Ubuntu 22.04)

2. **SSH into Droplet**:
```bash
ssh root@your-droplet-ip
```

3. **Install Dependencies**:
```bash
# Java
apt update
apt install openjdk-17-jdk -y

# MySQL
apt install mysql-server -y

# Nginx
apt install nginx -y

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install nodejs -y
```

4. **Setup MySQL**:
```bash
mysql_secure_installation
mysql -u root -p < setup-database.sql
```

5. **Deploy Backend**:
```bash
# Upload JAR file
scp target/smartfarm-backend-0.0.1-SNAPSHOT.jar root@your-droplet-ip:/opt/smartfarm/

# Create systemd service
nano /etc/systemd/system/smartfarm-backend.service
```

```ini
[Unit]
Description=SmartFarm360 Backend
After=syslog.target

[Service]
User=root
ExecStart=/usr/bin/java -jar /opt/smartfarm/smartfarm-backend-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143
Environment="DATABASE_URL=jdbc:mysql://localhost:3306/smartfarm360_db"
Environment="DATABASE_USERNAME=root"
Environment="DATABASE_PASSWORD=your_password"

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable smartfarm-backend
systemctl start smartfarm-backend
```

6. **Deploy Frontend**:
```bash
# Upload dist files
scp -r dist/smartfarm-frontend/* root@your-droplet-ip:/var/www/smartfarm360/

# Configure Nginx (see Nginx config above)
systemctl restart nginx
```

---

## Docker Deployment

### Create Dockerfiles

#### Backend Dockerfile

Create `smartfarm-backend/Dockerfile`:

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/smartfarm-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Frontend Dockerfile

Create `smartfarm-frontend/Dockerfile`:

```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

FROM nginx:alpine
COPY --from=build /app/dist/smartfarm-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: smartfarm360_db
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./smartfarm-backend/setup-database.sql:/docker-entrypoint-initdb.d/setup.sql

  backend:
    build: ./smartfarm-backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: jdbc:mysql://mysql:3306/smartfarm360_db
      DATABASE_USERNAME: root
      DATABASE_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MAIL_USERNAME: ${MAIL_USERNAME}
      MAIL_PASSWORD: ${MAIL_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mysql

  frontend:
    build: ./smartfarm-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql-data:
```

### Run with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection URL | `jdbc:mysql://localhost:3306/smartfarm360_db` |
| `DATABASE_USERNAME` | Database username | `root` |
| `DATABASE_PASSWORD` | Database password | `your_secure_password` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | Email address | `your.email@gmail.com` |
| `MAIL_PASSWORD` | Email app password | `xxxx xxxx xxxx xxxx` |
| `JWT_SECRET` | JWT signing secret | `your_long_random_string` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `ADMIN_EMAIL` | Admin email | `admin@smartfarm360.com` |
| `JWT_EXPIRATION` | Token expiration (ms) | `86400000` (24h) |

---

## Security Checklist

### Before Production Deployment

- [ ] Change all default passwords
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Use environment variables (not hardcoded)
- [ ] Enable firewall rules
- [ ] Set up database backups
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring/logging
- [ ] Use App Passwords for email
- [ ] Disable debug mode
- [ ] Remove test/demo accounts
- [ ] Update security headers
- [ ] Enable SQL injection protection
- [ ] Set up intrusion detection
- [ ] Regular security updates

### Database Security

```sql
-- Create dedicated database user (not root)
CREATE USER 'smartfarm_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON smartfarm360_db.* TO 'smartfarm_user'@'localhost';
FLUSH PRIVILEGES;
```

### Nginx Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

---

## Monitoring & Maintenance

### Health Checks

Backend health endpoint:
```
GET http://your-domain.com:8080/actuator/health
```

### Logging

Backend logs location:
```
smartfarm-backend/logs/spring-boot-logger.log
```

### Database Backups

```bash
# Backup
mysqldump -u root -p smartfarm360_db > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p smartfarm360_db < backup_20241107.sql
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mysqldump -u root -pYOUR_PASSWORD smartfarm360_db > /backups/smartfarm_$(date +\%Y\%m\%d).sql
```

---

## Performance Optimization

### Backend

1. **Enable caching**
2. **Use connection pooling**
3. **Optimize database queries**
4. **Enable compression**
5. **Use CDN for static assets**

### Frontend

1. **Enable lazy loading**
2. **Optimize images**
3. **Use CDN**
4. **Enable gzip compression**
5. **Minimize bundle size**

---

## Troubleshooting Production Issues

### Backend Not Starting

```bash
# Check logs
tail -f smartfarm-backend/logs/spring-boot-logger.log

# Check if port is in use
netstat -tulpn | grep 8080

# Check Java version
java -version
```

### Database Connection Issues

```bash
# Test MySQL connection
mysql -h localhost -u root -p

# Check MySQL status
systemctl status mysql

# View MySQL logs
tail -f /var/log/mysql/error.log
```

### Email Not Sending

1. Verify Gmail App Password
2. Check firewall rules (port 587)
3. Review backend logs
4. Test SMTP connection

---

## Support & Resources

- **Documentation**: See project README.md
- **Issues**: https://github.com/benjangure/smartfarm360/issues
- **Email**: ngurebenjamin5@gmail.com

---

**Version**: 1.0.0  
**Last Updated**: November 2024
