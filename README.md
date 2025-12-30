# DialyFlow - HIPAA-Compliant Dialysis Patient Management System

A comprehensive, production-ready web application for managing dialysis patient visits, documentation, and billing across multiple dialysis units.

## 🌟 Features

### Patient Management
- Comprehensive patient records with demographics
- Unit and shift assignments
- Manual patient entry for unlisted patients
- Search and filter capabilities

### Visit Documentation
- In-person and telemedicine visit tracking
- Record completion tracking
- Care plan documentation (weekly notes)
- CIPA documentation (monthly notes)
- Billing codes and referrals management
- Comment system with full history

### Multi-Unit Support
- **West Iredell** - Full service dialysis center
- **Taylorsville** - Community dialysis facility
- **Lake Norman** - Lakeside dialysis unit
- **Statesville** - Downtown dialysis center
- **Wilkesboro** - Mountain region facility

### Shift Schedules
- M/W/F - First Shift
- M/W/F - Second Shift
- T/Th/Sat - First Shift
- T/Th/Sat - Second Shift
- PD (Peritoneal Dialysis)

### Role-Based Access Control
- **Admin**: Full system access, user management, patient management, data export
- **Doctor/PA**: Visit documentation, patient records, comment management
- **Billing**: Billing codes, referrals, export billing data

### Security & Compliance
- ✅ HIPAA-compliant security measures
- ✅ Two-factor authentication (Google Authenticator)
- ✅ Audit logging for all actions
- ✅ Encrypted data storage
- ✅ Secure session management
- ✅ Role-based permissions

### Data Export
- Date range selection
- Excel and CSV formats
- Filtered by unit/shift
- Excludes sensitive comments
- Includes export metadata

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type-safe server code
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Token-based authentication
- **Speakeasy** - 2FA implementation
- **bcrypt** - Password hashing
- **Winston** - Logging
- **ExcelJS** - Excel file generation

### Development
- **npm workspaces** - Monorepo management
- **ESLint** - Code linting
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📦 Installation & Deployment

> **📘 For complete deployment instructions**, see [DEPLOYMENT.md](./DEPLOYMENT.md)
> 
> The deployment guide covers:
> - Step-by-step setup from cloning to production
> - Local development with TypeScript
> - Docker deployment
> - Production server configuration
> - Database setup and seeding
> - Environment configuration
> - Troubleshooting and security checklist

### Quick Start

#### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Docker and Docker Compose (optional)

#### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/ryantcrews/DialyFlow.git
cd DialyFlow
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `server` directory:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dialyflow

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# 2FA
TWO_FACTOR_ISSUER=DialyFlow

# Admin User
ADMIN_EMAIL=admin@dialyflow.com
ADMIN_PASSWORD=Admin123!@#
```

4. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6

# Or use your local MongoDB installation
mongod
```

5. **Seed the database**
```bash
npm run seed --workspace=server
```

6. **Start development servers**
```bash
# Start both client and server
npm run dev

# Or start them separately
npm run dev:server
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Docker Setup

1. **Build and start containers**
```bash
docker-compose up -d
```

2. **Seed the database**
```bash
docker-compose exec server npm run seed
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

4. **Stop containers**
```bash
docker-compose down
```

## 🚀 Usage

### First Time Setup

1. **Login as admin**
   - Email: `admin@dialyflow.com`
   - Password: `Admin123!@#`
   - Complete 2FA setup with Google Authenticator

2. **Create users**
   - Navigate to Admin Dashboard → Users
   - Add doctors, PAs, and billing staff
   - Assign roles and unit access

3. **Add patients**
   - Navigate to Admin Dashboard → Patients
   - Add patient demographics
   - Assign to units and shifts

### Daily Workflow

1. **Login** with your credentials
2. **Complete 2FA** verification
3. **Select visit type** (In-Person or Telemedicine)
4. **Choose unit** from the dashboard
5. **Select shift** for the day
6. **View patient list** for that shift
7. **Open patient record** and complete documentation:
   - Mark record completion
   - Complete care plan (weekly)
   - Complete CIPA (monthly)
   - Add billing codes
   - Add referrals
   - Add comments
8. **Save** the visit record

### Admin Tasks

1. **User Management**
   - Create/edit/delete users
   - Assign roles and permissions
   - Manage 2FA settings

2. **Patient Management**
   - Add/edit/delete patients
   - Assign to units and shifts
   - View patient history

3. **Data Export**
   - Select date range
   - Choose format (Excel/CSV)
   - Filter by unit/shift
   - Download report

## 📊 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/verify-2fa` - Verify 2FA code
- `POST /api/auth/setup-2fa` - Setup 2FA for user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Patient Endpoints

- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Visit Endpoints

- `GET /api/visits` - List visits (with filters)
- `POST /api/visits` - Create visit record
- `GET /api/visits/:id` - Get visit by ID
- `PUT /api/visits/:id` - Update visit
- `DELETE /api/visits/:id` - Delete visit

### Comment Endpoints

- `GET /api/comments/visit/:visitId` - Get comments for visit
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Admin Endpoints

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/export` - Export data

## 🔒 Security

### HIPAA Compliance
- All PHI is encrypted at rest and in transit
- Comprehensive audit logging
- Role-based access control
- Secure session management
- Password complexity requirements
- Automatic session timeout

### Authentication
- JWT tokens with HTTP-only cookies
- Two-factor authentication required
- Password hashing with bcrypt (12 rounds)
- Token expiration and refresh
- Account lockout after failed attempts

### Data Protection
- Input validation with Zod schemas
- XSS protection
- CSRF protection
- SQL injection prevention (NoSQL)
- Rate limiting
- Security headers with Helmet

## 📝 User Roles

### Admin
- Full system access
- User management (create, edit, delete)
- Patient management (create, edit, delete)
- Data export with full access
- Audit log viewing
- System configuration

### Doctor/PA
- View assigned patients
- Create and update visit records
- Add comments
- View patient history
- Mark completion flags
- Add billing codes and referrals

### Billing
- View billing-related data
- Export billing reports
- View billing codes and referrals
- Limited patient information access

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm test --workspace=server
npm test --workspace=client

# Run with coverage
npm run test:coverage
```

## 🏗 Building for Production

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build:server
npm run build:client

# Start production server
npm start --workspace=server
```

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For support, please contact the development team or open an issue in the repository.

## 🔄 Version History

### Version 1.0.0 (Initial Release)
- Complete patient management system
- Multi-unit and shift support
- Visit documentation and tracking
- Admin dashboard
- 2FA authentication
- Data export functionality
- HIPAA-compliant security
- Audit logging
- Comment system
