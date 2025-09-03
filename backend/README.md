# TagSakay Backend

This is the backend server for the TagSakay RFID Tricycle Queue Management System.

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── seeders/        # Database seeders
│   ├── utils/          # Utility functions
│   └── app.js          # Application entry point
├── .env                # Environment variables
├── package.json        # Project dependencies
└── README.md           # This file
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

The project includes a comprehensive database CLI tool (`dbcli.js`) for managing your TagSakay database:

```bash
# Show all available commands
npm run db

# Seed the database with sample data
npm run db:seed

# Reset and seed the database (delete existing data first)
npm run db:seed:reset

# Check database connection and content
npm run db:check

# Sync database schema (create tables if they don't exist)
npm run db:sync

# Modify existing tables to match models
npm run db:sync:alter

# Drop all tables and recreate them
npm run db:sync:force
```

You can also run the CLI directly with additional options:

```bash
# Seed with 10 scan records per RFID tag
node dbcli.js seed --scan-count=10

# Get verbose output
node dbcli.js check --verbose
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

## Development

### Seeding Data

The seeding system allows you to populate your database with sample data for development purposes. See the [Seeders README](./src/seeders/README.md) for more details.

### Adding New Features

1. Create/update models in `src/models/`
2. Create/update controllers in `src/controllers/`
3. Create/update routes in `src/routes/`
4. Update the seeders if necessary

## License

This project is proprietary and confidential.
