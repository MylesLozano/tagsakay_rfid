# TagSakay Backend

A backend service for the TagSakay application, providing API endpoints for transportation management with RFID integration.

## Overview

This backend system is built with Node.js, Express, and PostgreSQL (using Sequelize ORM). It's designed to support the TagSakay transportation management system with features like user management, authentication, and RFID tag processing.

## Project Structure

```
backend/
├── logs/               # Application logs
├── node_modules/       # Dependencies
├── src/                # Source code
│   ├── app.js          # Main application entry point
│   ├── config/         # Configuration files
│   │   ├── database.js # Database connection setup
│   │   └── logger.js   # Logging configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Sequelize models
│   │   ├── index.js    # Models initialization
│   │   └── User.js     # User model definition
│   ├── routes/         # API routes
│   └── utils/          # Utility functions
└── package.json        # Project dependencies and scripts
```

## Features

- **User Management**: Admin, SuperAdmin, and Driver roles
- **Authentication**: JWT-based authentication
- **RFID Integration**: Support for RFID tag processing
- **Logging**: Comprehensive logging with Winston
- **API Security**: CORS, Helmet, and rate limiting

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Nikolajmc/testingproj.git
   cd testingproj
   ```

2. Install dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:

   ```
   # Server Configuration
   PORT=3000

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password
   DB_NAME=tagsakay_db

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=1d
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /`: Health check endpoint
- More endpoints coming soon...

## Development

This project uses:

- **Express**: Web framework
- **Sequelize**: ORM for database interactions
- **Winston**: Logging library
- **Helmet**: Security middleware
- **Dotenv**: Environment variable management

## Branch Information

This `tagsakay_backend` branch contains the backend implementation of the TagSakay system.
