# TagSakay RFID System - Scripts

This folder contains utility scripts for managing the TagSakay RFID system.

## Database Management

### Database Manager Script

The `db-manager.js` script provides a comprehensive set of database management functions.

Usage:

```bash
# Show help
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

### Migration Manager Script

The `migrate-manager.js` script runs database migrations.

Usage:

```bash
# Run migrations
npm run migrate
```

## Device Management

The `device-manager.js` script manages RFID devices in the system.

Usage:

```bash
# Show help
npm run device

# Register a new device
npm run device:register <mac-address> <name> <location>
# Example: npm run device:register 00:11:22:33:44:55 "Entrance Gate" "Main Building"

# List all registered devices
npm run device:list

# Enable registration mode
node scripts/device-manager.js enable-reg <device-id> [tag-id]

# Disable registration mode
node scripts/device-manager.js disable-reg <device-id>
```

## API Testing

The `test-endpoint.js` script allows testing API endpoints from the command line.

Usage:

```bash
# Show available endpoints
npm run test:api

# Test a specific endpoint
npm run test:api <endpoint-name> [custom-data-json]
# Example: npm run test:api login
# Example: npm run test:api scanRfid '{"tagId":"ABCDEF12","deviceId":"001122334455"}'
```

## Legacy Scripts

These scripts are now consolidated into the above utilities but are kept for reference:

- `init-db.js` - Functionality now in `db-manager.js`
- `init-db-schema.js` - Functionality now in `db-manager.js`
- `run-seeders.js` - Functionality now in `db-manager.js`
- `terminate-connections.js` - Functionality now in `db-manager.js`
- `reset-db.js` - Functionality now in `db-manager.js`
