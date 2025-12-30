# DialyFlow Deployment Guide

Complete step-by-step instructions for setting up, deploying, and running DialyFlow from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [Testing the Deployment](#testing-the-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js and npm**
   - Version: Node.js 18.x or higher
   - Check version: `node --version` and `npm --version`
   - Download: https://nodejs.org/

2. **MongoDB**
   - Version: MongoDB 6.0 or higher
   - Check version: `mongod --version`
   - Download: https://www.mongodb.com/try/download/community

3. **Git**
   - Any recent version
   - Check version: `git --version`
   - Download: https://git-scm.com/downloads

### Optional (for Docker deployment)

4. **Docker**
   - Version: Docker 20.x or higher
   - Check version: `docker --version`
   - Download: https://docs.docker.com/get-docker/

5. **Docker Compose**
   - Version: Docker Compose 2.x or higher
   - Check version: `docker-compose --version`
   - Usually included with Docker Desktop

---

## Getting Started

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/ryantcrews/DialyFlow.git

# Navigate into the project directory
cd DialyFlow

# Verify the directory structure
ls -la
```

You should see:
```
.git/
.gitignore
README.md
IMPLEMENTATION.md
DEPLOYMENT.md
docker-compose.yml
package.json
package-lock.json
client/
server/
shared/
```

---

## Local Development Setup

### Step 1: Install Dependencies

The project uses npm workspaces. Install all dependencies with a single command:

```bash
# Install dependencies for all workspace packages (root, client, server, shared)
npm install
```

This will install:
- ~600 packages total
- Root dependencies (concurrently)
- Server dependencies (Express, MongoDB, JWT, etc.)
- Client dependencies (React, Vite, TailwindCSS, etc.)
- Shared dependencies (TypeScript)

**Expected output:**
```
added 600 packages, and audited 604 packages in 45s
```

### Step 2: Set Up MongoDB

You have two options for MongoDB:

#### Option A: Local MongoDB Installation

```bash
# Start MongoDB service (macOS/Linux)
sudo systemctl start mongod

# Or on macOS with Homebrew
brew services start mongodb-community

# Or manually
mongod --dbpath /path/to/data/directory
```

#### Option B: MongoDB in Docker

```bash
# Run MongoDB in a Docker container
docker run -d \
  --name dialyflow-mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:6

# Verify it's running
docker ps | grep mongodb
```

### Step 3: Configure Environment Variables

Create the environment file for the server:

```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit the environment file
nano server/.env  # or use your preferred editor
```

**Minimal configuration** (`server/.env`):
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/dialyflow

# JWT Authentication (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-256-bit
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Two-Factor Authentication
TWO_FACTOR_ISSUER=DialyFlow

# Default Admin User (for database seeding)
ADMIN_EMAIL=admin@dialyflow.com
ADMIN_PASSWORD=Admin123!@#
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_TIMEOUT_MINUTES=60
```

**Important:** For production, generate a secure JWT secret:
```bash
# Generate a secure random string (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Build TypeScript Code

Build both the server and client:

```bash
# Build all workspaces
npm run build

# Or build individually
npm run build:server
npm run build:client
```

**Expected output:**
```
Server build:
> @dialyflow/server@1.0.0 build
> tsc
✓ Built successfully

Client build:
> @dialyflow/client@1.0.0 build
> tsc && vite build
✓ 114 modules transformed.
dist/index.html                   0.49 kB
dist/assets/index-dqUWJ4bk.css   13.61 kB
dist/assets/index-D3JSMoVy.js   262.33 kB
✓ built in 2.19s
```

### Step 5: Seed the Database

Populate the database with initial data (units, shifts, admin user):

```bash
# Run the seeding script
npm run seed --workspace=server
```

**Expected output:**
```
Starting database seeding...
MongoDB connected successfully
Seeding units...
Created unit: West Iredell
Created unit: Taylorsville
Created unit: Lake Norman
Created unit: Statesville
Created unit: Wilkesboro
Seeding shifts...
Created shift: Monday/Wednesday/Friday - First Shift for West Iredell
Created shift: Monday/Wednesday/Friday - Second Shift for West Iredell
... (25 shifts total)
Seeding admin user...
Created admin user: admin@dialyflow.com
Database seeding completed successfully!
Seeding complete, closing database connection
```

### Step 6: Start the Development Servers

Start both the backend and frontend servers:

```bash
# Start both servers concurrently
npm run dev
```

This starts:
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:3000

**Expected output:**
```
[server] Server running on port 5000 in development mode
[server] MongoDB connected successfully
[client] VITE v5.0.10  ready in 523 ms
[client] ➜  Local:   http://localhost:3000/
[client] ➜  Network: use --host to expose
```

**Alternative:** Run servers separately in different terminals:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

---

## Docker Deployment

### Step 1: Set Up Environment Variables

Create the `.env` file as described in the Local Development Setup (Step 3).

**Important:** Update the `MONGODB_URI` for Docker:
```env
MONGODB_URI=mongodb://mongodb:27017/dialyflow
```

### Step 2: Create Dockerfiles

The Dockerfiles are already included in the repository:
- `server/Dockerfile` - Backend container
- `client/Dockerfile` - Frontend container (with Nginx)

### Step 3: Build and Start Containers

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check running containers
docker ps
```

**Expected containers:**
- `dialyflow-mongodb` - MongoDB database (port 27017)
- `dialyflow-server` - Backend API (port 5000)
- `dialyflow-client` - Frontend app (port 3000)

### Step 4: Seed the Database (Docker)

```bash
# Run seeding script in the server container
docker-compose exec server npm run seed
```

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Step 6: Stop and Clean Up

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v

# View logs for debugging
docker-compose logs server
docker-compose logs client
docker-compose logs mongodb
```

---

## Production Deployment

### Prerequisites for Production

1. **Server Requirements**
   - Ubuntu 20.04+ or similar Linux distribution
   - 2+ CPU cores
   - 4GB+ RAM
   - 20GB+ storage
   - Static IP or domain name

2. **Security Requirements**
   - SSL certificate (Let's Encrypt recommended)
   - Firewall configured (UFW or iptables)
   - SSH access with key-based authentication

### Step 1: Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install PM2 (for process management)
sudo npm install -g pm2
```

### Step 2: Clone and Build

```bash
# Create application directory
sudo mkdir -p /var/www/dialyflow
sudo chown $USER:$USER /var/www/dialyflow

# Clone repository
cd /var/www/dialyflow
git clone https://github.com/ryantcrews/DialyFlow.git .

# Install dependencies
npm install

# Build applications
npm run build
```

### Step 3: Configure Production Environment

```bash
# Create production environment file
nano server/.env
```

**Production `.env`** (update all values):
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/dialyflow

# JWT Authentication - GENERATE NEW SECRET!
JWT_SECRET=REPLACE_WITH_SECURE_256_BIT_RANDOM_STRING
JWT_EXPIRES_IN=7d

# CORS - Set to your domain
CORS_ORIGIN=https://yourdomain.com

# Two-Factor Authentication
TWO_FACTOR_ISSUER=DialyFlow

# Admin User
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_TIMEOUT_MINUTES=60
```

### Step 4: Seed Production Database

```bash
# Run seeding script
npm run seed --workspace=server
```

### Step 5: Set Up PM2 Process Manager

```bash
# Start the server with PM2
cd /var/www/dialyflow
pm2 start server/dist/server.js --name dialyflow-server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command output instructions

# View logs
pm2 logs dialyflow-server

# Monitor the application
pm2 monit
```

### Step 6: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/dialyflow
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (update paths after obtaining certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend - Serve static files
    location / {
        root /var/www/dialyflow/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Reverse proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000;
    }
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/dialyflow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 7: Obtain SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

### Step 8: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

---

## Database Setup

### MongoDB Configuration

#### Local Development

Default configuration works out of the box. MongoDB runs on `localhost:27017`.

#### Production

Secure your MongoDB installation:

```bash
# Enable authentication
sudo nano /etc/mongod.conf
```

Add to configuration:
```yaml
security:
  authorization: enabled
```

Create admin user:

```javascript
// Connect to MongoDB
mongosh

// Create admin user
use admin
db.createUser({
  user: "dialyflowAdmin",
  pwd: "SECURE_PASSWORD_HERE",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

// Create application user
use dialyflow
db.createUser({
  user: "dialyflowApp",
  pwd: "SECURE_APP_PASSWORD_HERE",
  roles: [{ role: "readWrite", db: "dialyflow" }]
})
```

Update `server/.env`:
```env
MONGODB_URI=mongodb://dialyflowApp:SECURE_APP_PASSWORD_HERE@localhost:27017/dialyflow?authSource=dialyflow
```

### Database Backup

```bash
# Backup database
mongodump --db dialyflow --out /backup/dialyflow-$(date +%Y%m%d)

# Restore database
mongorestore --db dialyflow /backup/dialyflow-20231230/dialyflow
```

---

## Environment Configuration

### Server Environment Variables

All server configuration is in `server/.env`:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | Yes |
| `NODE_ENV` | Environment | development | Yes |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/dialyflow | Yes |
| `JWT_SECRET` | Secret for JWT signing | - | Yes |
| `JWT_EXPIRES_IN` | Token expiration | 7d | Yes |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 | Yes |
| `TWO_FACTOR_ISSUER` | 2FA issuer name | DialyFlow | Yes |
| `ADMIN_EMAIL` | Default admin email | admin@dialyflow.com | Yes |
| `ADMIN_PASSWORD` | Default admin password | - | Yes |
| `ADMIN_FIRST_NAME` | Admin first name | Admin | No |
| `ADMIN_LAST_NAME` | Admin last name | User | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | No |
| `SESSION_TIMEOUT_MINUTES` | Session timeout | 60 | No |

### Client Configuration

The client uses Vite's proxy configuration in `client/vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

For production, the client makes requests to the same origin (handled by Nginx).

---

## Running the Application

### Development Mode

```bash
# Start both servers
npm run dev

# Or start separately
npm run dev:server  # Backend on :5000
npm run dev:client  # Frontend on :3000
```

### Production Mode

```bash
# Build applications
npm run build

# Start server with PM2
pm2 start server/dist/server.js --name dialyflow-server

# Serve client with Nginx (configured above)
```

### Docker Mode

```bash
# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## Testing the Deployment

### 1. Verify Services

```bash
# Check MongoDB
mongo dialyflow --eval "db.stats()"
# Or with Docker: docker-compose exec mongodb mongosh dialyflow --eval "db.stats()"

# Check server health
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"2023-12-30T..."}

# Check frontend
curl http://localhost:3000
# Should return HTML
```

### 2. Test Login

1. Open browser: http://localhost:3000
2. You should see the DialyFlow login page
3. Login with default credentials:
   - **Email:** admin@dialyflow.com
   - **Password:** Admin123!@# (or your configured password)

### 3. Setup Two-Factor Authentication

1. After login, navigate to your profile
2. Click "Setup 2FA"
3. Scan QR code with Google Authenticator app
4. Enter the 6-digit code to enable 2FA
5. Logout and login again to test 2FA

### 4. Test Application Features

1. **Visit Type Selection:** Choose "In-Person" or "Telemedicine"
2. **Unit Selection:** Select one of the 5 dialysis units
3. **Shift Selection:** Select a shift
4. **Patient List:** Verify patients load (may be empty initially)
5. **Admin Dashboard:** Navigate to Admin → Patients/Users/Export

### 5. Verify Database Seeding

```bash
# Check units
mongo dialyflow --eval "db.units.find().pretty()"

# Check shifts
mongo dialyflow --eval "db.shifts.find().pretty()"

# Check admin user
mongo dialyflow --eval "db.users.find({email:'admin@dialyflow.com'}).pretty()"
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

**Error:** `MongooseServerSelectionError: connect ECONNREFUSED`

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string in server/.env
# Verify MONGODB_URI is correct
```

#### 2. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change PORT in server/.env
```

#### 3. Build Errors

**Error:** TypeScript compilation errors

**Solution:**
```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf client/node_modules server/node_modules shared/node_modules
npm install

# Rebuild
npm run build
```

#### 4. CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
```bash
# Update CORS_ORIGIN in server/.env
CORS_ORIGIN=http://localhost:3000

# For production with domain
CORS_ORIGIN=https://yourdomain.com

# Restart server
pm2 restart dialyflow-server
```

#### 5. 2FA QR Code Not Showing

**Error:** QR code doesn't display

**Solution:**
- Ensure `qrcode` package is installed: `npm list qrcode`
- Check browser console for errors
- Verify speakeasy is working: `npm list speakeasy`

### Logs and Debugging

#### Server Logs

```bash
# Development
# Logs appear in console

# Production with PM2
pm2 logs dialyflow-server

# Docker
docker-compose logs server
```

#### Application Logs

Server logs are written to:
- `server/logs/error.log` - Error logs
- `server/logs/combined.log` - All logs

```bash
# View error logs
tail -f server/logs/error.log

# View all logs
tail -f server/logs/combined.log
```

#### MongoDB Logs

```bash
# System logs
sudo journalctl -u mongod

# MongoDB log file (usually)
tail -f /var/log/mongodb/mongod.log
```

### Performance Issues

#### Slow Database Queries

```bash
# Enable MongoDB profiling
mongo dialyflow --eval "db.setProfilingLevel(2)"

# View slow queries
mongo dialyflow --eval "db.system.profile.find().limit(5).sort({ts:-1}).pretty()"
```

#### High Memory Usage

```bash
# Check memory usage
free -h

# Check PM2 processes
pm2 list

# Restart server
pm2 restart dialyflow-server
```

### Getting Help

1. **Check logs first** - Most issues are visible in logs
2. **Review environment variables** - Ensure all are correctly set
3. **Verify MongoDB connection** - Test connection string
4. **Check firewall rules** - Ensure ports are open
5. **Review IMPLEMENTATION.md** - Contains detailed technical information

---

## Additional Resources

- **Main README:** See [README.md](./README.md) for feature overview
- **Implementation Details:** See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for technical details
- **GitHub Repository:** https://github.com/ryantcrews/DialyFlow
- **MongoDB Documentation:** https://docs.mongodb.com/
- **Node.js Documentation:** https://nodejs.org/docs/
- **React Documentation:** https://react.dev/

---

## Security Checklist

Before going to production:

- [ ] Change default admin password
- [ ] Generate secure JWT secret (256-bit minimum)
- [ ] Enable MongoDB authentication
- [ ] Configure firewall (UFW/iptables)
- [ ] Obtain SSL certificate (Let's Encrypt)
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Review audit logs regularly
- [ ] Enable 2FA for all users
- [ ] Set strong password policy
- [ ] Configure session timeout
- [ ] Update CORS origin to production domain
- [ ] Set NODE_ENV=production
- [ ] Review and limit file permissions
- [ ] Set up monitoring (PM2, logs)
- [ ] Configure log rotation

---

**Last Updated:** December 2024
**Version:** 1.0.0
