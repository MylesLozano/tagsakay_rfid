# TagSakay RFID Queue Management System

A comprehensive RFID-based tricycle queue management system with ESP32 integration, user management, and real-time monitoring capabilities.

## Project Overview

TagSakay is an RFID-based queue management system designed for tricycle transportation services. The system consists of three main components:

1. **Backend**: Node.js API server with PostgreSQL database
2. **Frontend**: Vue.js web application for administration and monitoring
3. **ESP32 Firmware**: RFID scanner for physical tag scanning and registration

## Project Structure

`tagsakay_rfid/
├── backend/              # Express.js API server
│   ├── config/           # Configuration files
│   ├── docs/             # API documentation
│   ├── logs/             # Application logs
│   ├── migrations/       # Database migrations
│   ├── scripts/          # Utility scripts
│   ├── seeders/          # Database seeders
│   └── src/              # Source code
│       ├── controllers/  # Request handlers
│       ├── middleware/   # Express middleware
│       ├── models/       # Sequelize models
│       └── routes/       # API routes
├── frontend/             # Vue.js web application
│   ├── public/           # Static assets
│   └── src/              # Source code
│       ├── components/   # Vue components
│       ├── router/       # Vue Router configuration
│       ├── services/     # API service layer
│       └── views/        # Vue page components
└── esp32/                # ESP32 RFID scanner firmware
    └── TagSakay_RFID_Scanner/  # Arduino sketch files`

## Features

### Backend

- **User Management**: Admin, SuperAdmin, and Driver roles
- **Authentication**: JWT-based authentication
- **RFID Management**: Register, scan, and track RFID tags
- **API Key System**: Secure device authentication
- **Device Management**: Register and monitor ESP32 RFID scanners
- **Database Management**: Comprehensive scripts for DB operations
- **Logging**: Detailed system logging with Winston

### Frontend

- **Dashboard**: Real-time system overview with key metrics
- **RFID Management**: Register and manage RFID tags
- **User Management**: Create and manage system users
- **API Key Management**: Generate and revoke API keys
- **Device Monitoring**: Track connected RFID scanners
- **Live RFID Scanning**: View real-time scan events
- **Role-Based Access Control**: Different views per user role
- **Responsive Design**: Mobile-friendly interface

### ESP32 RFID Scanner

- **RFID Scanning**: Read MIFARE RFID cards
- **API Integration**: Send scan data to backend
- **Registration Mode**: Support for registering new RFID cards
- **Status Reporting**: Regular heartbeat and status updates

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Arduino IDE (for ESP32 development)

### Backend Setup

1. Navigate to the backend directory:
   `bash
cd backend
`

2. Install dependencies:
   `bash
npm install
`

3. Create a .env file with the following variables:
   `PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tagsakay_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d`

4. Initialize the database:
   `bash
npm run db:full
`

5. Start the development server:
   `bash
npm run dev
`

### Frontend Setup

1. Navigate to the frontend directory:
   `bash
cd frontend
`

2. Install dependencies:
   `bash
npm install
`

3. Create a .env file:
   `VITE_API_URL=http://localhost:3000/api`

4. Start the development server:
   `bash
npm run dev
`

## Database Management

The project includes comprehensive database management scripts:

`bash

# Show all available commands

npm run db

# Reset database (drop and create)

npm run db:reset

# Initialize database schema

npm run db:init

# Seed database with test data

npm run db:seed

# Full reset, init, and seed in one command

npm run db:full
`

## Device Management

Register and manage RFID scanning devices:

`bash

# Show help

npm run device

# Register a new device

npm run device:register 00:11:22:33:44:55 \
Entrance
Gate\ \Main
Building\

# List all registered devices

npm run device:list

# Enable registration mode

npm run device:enable-reg <device-id> [tag-id]

# Disable registration mode

npm run device:disable-reg <device-id>
`

## API Testing

Test API endpoints from the command line:

`bash

# Show available endpoints

npm run test:api

# Test a specific endpoint

npm run test:api login
npm run test:api scanRfid '{\tagId\:\ABCDEF12\,\deviceId\:\001122334455\}'
`

## Test Accounts

The following test accounts are available after seeding the database:

- Admin: admin@tagsakay.com / Admin@123
- Dispatcher: dispatcher@tagsakay.com / Dispatch@123
- Driver 1: driver1@tagsakay.com / Driver@123
- Driver 2: driver2@tagsakay.com / Driver@123
- Passenger: passenger1@example.com / Pass@123

## User Roles

- **SuperAdmin**: Full system access
- **Admin**: Management access to users, devices and RFID tags
- **Driver**: Limited access to dashboard and personal information

## License

This project is proprietary and confidential.
