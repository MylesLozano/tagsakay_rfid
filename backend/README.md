# TagSakay Backend

This is the backend server for the TagSakay RFID Tricycle Queue Management System.

## Project Structure

```
backend/
├── scripts/          # Utility scripts for database and device management
├── migrations/       # Database migration scripts
├── seeders/          # Database seed data
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Express middleware
│   ├── models/       # Sequelize models
│   ├── routes/       # API routes
│   └── app.js        # Application entry point
├── docs/             # API documentation
├── logs/             # Application logs
├── .env              # Environment variables
├── package.json      # Project dependencies
└── README.md         # This file
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and configure your database connection:
   ```
   DB_HOST=localhost
   DB_NAME=tagsakay_db
   DB_USER=postgres
   DB_PASS=your_password
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ```

## Database Management

The project includes comprehensive database management scripts:

```bash
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
```

## Device Management

Scripts for managing RFID devices in the system:

```bash
# Show help
npm run device

# Register a new device
npm run device:register 00:11:22:33:44:55 "Entrance Gate" "Main Building"

# List all registered devices
npm run device:list
```

## API Testing

Test API endpoints from the command line:

```bash
# Show available endpoints
npm run test:api

# Test a specific endpoint
npm run test:api login
npm run test:api scanRfid '{"tagId":"ABCDEF12","deviceId":"001122334455"}'
```

### Running the Server

Development mode with auto-reload:

```
npm run dev
```

Production mode:

```
npm start
```

## Database Migrations

Run database migrations to update your schema:

```
npm run migrate
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token

### RFID Management

- `GET /api/rfid` - Get all RFID tags
- `POST /api/rfid` - Register a new RFID tag
- `GET /api/rfid/:id` - Get RFID tag by ID
- `PUT /api/rfid/:id` - Update RFID tag
- `DELETE /api/rfid/:id` - Delete RFID tag

### RFID Scanning

- `POST /api/rfid/scan` - Record an RFID scan event
- `GET /api/rfid/scan/history` - Get scan history

### API Keys

- `GET /api/keys` - Get all API keys
- `POST /api/keys` - Create a new API key
- `DELETE /api/keys/:id` - Revoke an API key

### Device Management

- `GET /api/devices` - Get all devices
- `POST /api/devices/register` - Register a new device
- `GET /api/devices/active` - Get active devices
- `POST /api/devices/:deviceId/heartbeat` - Device heartbeat
- `GET /api/devices/:deviceId/registration-mode` - Check registration mode
- `POST /api/devices/:deviceId/registration-mode` - Set registration mode

## Development

### Script Organization

All utility scripts are now organized in the `scripts/` directory:

- `db-manager.js` - Database management operations
- `device-manager.js` - Device management operations
- `migrate-manager.js` - Database migration runner
- `test-endpoint.js` - API endpoint testing tool
- `cleanup.js` - Legacy script cleanup tool

For details about available scripts, see [Scripts README](./scripts/README.md).

### Adding New Features

1. Create/update models in `src/models/`
2. Create/update controllers in `src/controllers/`
3. Create/update routes in `src/routes/`
4. Update the seeders if necessary

## License

This project is proprietary and confidential.
