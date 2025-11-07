# SmartFarm360 🌾

A comprehensive farm management system that connects farm owners, supervisors, and workers for efficient agricultural operations.

## Features

### For System Administrators
- Manage all users and farms across the platform
- Approve/reject farm owner applications
- View system-wide analytics and reports
- Configure system settings
- Monitor platform activity

### For Farm Owners
- Submit and manage farm applications
- Create and manage multiple farms
- Hire and manage supervisors
- Assign supervisors to farms
- View farm analytics and reports
- Communicate with supervisors and system admins
- Track worker performance

### For Supervisors
- Manage assigned farms
- Create and assign tasks to workers
- Track worker attendance
- Monitor task completion
- Communicate with farm owners and workers
- View farm-specific reports

### For Workers
- View assigned tasks
- Update task status and progress
- Upload task completion photos
- Clock in/out for attendance
- Communicate with supervisors
- View personal performance metrics

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Security**: Spring Security with JWT
- **Email**: JavaMail API
- **Build Tool**: Maven

### Frontend
- **Framework**: Angular 17
- **Language**: TypeScript
- **UI Components**: Angular Material
- **HTTP Client**: Angular HttpClient
- **Routing**: Angular Router

## Prerequisites

- **Java**: JDK 17 or higher
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **MySQL**: 8.0 or higher
- **Maven**: 3.8 or higher

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smartfarm360.git
cd smartfarm360
```

### 2. Database Setup

#### Create Database
```bash
mysql -u root -p < smartfarm-backend/setup-database.sql
```

#### Create System Admin
```bash
mysql -u root -p < create-admin.sql
```

This creates an admin account with:
- **Username**: `admin`
- **Password**: `Admin@2024`
- ⚠️ **Change this password immediately after first login!**

See [ADMIN_SETUP_GUIDE.md](ADMIN_SETUP_GUIDE.md) for detailed admin setup instructions.

### 3. Backend Configuration

#### Configure Database Connection
Edit `smartfarm-backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/smartfarm360_db
    username: root
    password: your_mysql_password
```

#### Configure Email (Optional)
For email functionality, configure SMTP settings in `application.yml`:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your_email@gmail.com
    password: your_app_password
```

See [EMAIL_SETUP_GUIDE.md](EMAIL_SETUP_GUIDE.md) for detailed email configuration.

#### Build and Run Backend
```bash
cd smartfarm-backend
mvn clean install
mvn spring-boot:run
```

Backend will run on: http://localhost:8080

### 4. Frontend Setup

#### Install Dependencies
```bash
cd smartfarm-frontend
npm install
```

#### Run Development Server
```bash
npm start
```

Frontend will run on: http://localhost:4200

## Quick Start Scripts

### Windows
- **Start Backend**: `run-backend.bat`
- **Start Frontend**: `cd smartfarm-frontend && npm start`

### Linux/Mac
```bash
# Backend
cd smartfarm-backend && mvn spring-boot:run

# Frontend (in new terminal)
cd smartfarm-frontend && npm start
```

## Default Login Credentials

### System Admin
- **Username**: `admin`
- **Password**: `Admin@2024` (change immediately!)

### Demo Users
After admin setup, you can create additional users through the application:
- Farm Owners: Register via application form
- Supervisors: Created by Farm Owners
- Workers: Created by Supervisors

## Project Structure

```
smartfarm360/
├── smartfarm-backend/          # Spring Boot backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/smartfarm360/
│   │   │   │   ├── controller/     # REST controllers
│   │   │   │   ├── service/        # Business logic
│   │   │   │   ├── repository/     # Data access
│   │   │   │   ├── model/          # Entity models
│   │   │   │   ├── dto/            # Data transfer objects
│   │   │   │   ├── security/       # Security config
│   │   │   │   └── config/         # App configuration
│   │   │   └── resources/
│   │   │       ├── application.yml # App configuration
│   │   │       └── templates/      # Email templates
│   │   └── test/                   # Unit tests
│   ├── setup-database.sql          # Database schema
│   └── pom.xml                     # Maven dependencies
│
├── smartfarm-frontend/         # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/     # UI components
│   │   │   ├── services/       # API services
│   │   │   ├── models/         # TypeScript models
│   │   │   ├── guards/         # Route guards
│   │   │   └── interceptors/   # HTTP interceptors
│   │   ├── assets/             # Static assets
│   │   └── environments/       # Environment configs
│   ├── angular.json            # Angular config
│   └── package.json            # npm dependencies
│
├── create-admin.sql            # Admin creation script
├── ADMIN_SETUP_GUIDE.md        # Admin setup guide
├── EMAIL_SETUP_GUIDE.md        # Email configuration guide
└── README.md                   # This file
```

## API Documentation

Once the backend is running, access Swagger UI at:
http://localhost:8080/swagger-ui.html

## Key Features Explained

### Hierarchical User System
- **System Admin** → Manages entire platform
- **Farm Owner** → Owns farms, manages supervisors
- **Supervisor** → Manages workers, assigns tasks
- **Worker** → Completes tasks, tracks attendance

### Task Management
- Create tasks with priority levels
- Assign to specific workers
- Track progress (Pending → In Progress → Completed)
- Upload completion photos
- Record actual vs estimated hours

### Attendance Tracking
- Workers clock in/out
- Automatic duration calculation
- Attendance history and reports
- Supervisor oversight

### Messaging System
- Hierarchical communication
- Real-time message notifications
- Conversation threads
- Read/unread status

### Farm Management
- Multiple farms per owner
- Farm-specific supervisors
- Location and size tracking
- Farm analytics

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password encryption (BCrypt)
- Email verification
- Secure API endpoints
- CORS configuration

## Development

### Running Tests
```bash
# Backend
cd smartfarm-backend
mvn test

# Frontend
cd smartfarm-frontend
npm test
```

### Building for Production

#### Backend
```bash
cd smartfarm-backend
mvn clean package
java -jar target/smartfarm-backend-0.0.1-SNAPSHOT.jar
```

#### Frontend
```bash
cd smartfarm-frontend
npm run build
# Output in dist/ folder
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `application.yml`
- Ensure database exists: `SHOW DATABASES LIKE 'smartfarm360_db';`

### Backend Won't Start
- Check Java version: `java -version` (should be 17+)
- Verify port 8080 is available
- Check logs in `smartfarm-backend/logs/`

### Frontend Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node -v` (should be 18+)

### Login Issues
- Verify user exists in database
- Check `is_active` and `email_verified` flags
- Ensure correct password

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section

## Acknowledgments

Built with modern technologies for efficient farm management and agricultural operations.

---

**Version**: 1.0.0  
**Last Updated**: November 2024
