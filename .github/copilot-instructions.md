# TagSakay RFID System - AI Coding Agent Instructions

## System Architecture Overview

TagSakay is an RFID tricycle queue management system with three core components:

- **Backend**: Express.js + PostgreSQL API server (`backend/`)
- **Frontend**: Vue.js + TypeScript admin interface (`frontend/`)
- **ESP32**: RFID scanner firmware (`esp32.ino`) for physical devices

### Key Data Flow Patterns

1. **RFID Scanning**: ESP32 → Backend API → Database → Frontend Live Updates
2. **Device Management**: Frontend → Backend → Device Registration/Status
3. **User Authentication**: JWT-based with role-based access (SuperAdmin, Admin, Driver)

## Critical Development Workflows

### Database Management (Primary Interface)

```bash
# Essential commands - always use these instead of raw SQL
npm run db:full        # Complete reset + init + seed (development)
npm run db:reset       # Drop and recreate database
npm run db:init        # Create schema only
npm run db:seed        # Add test data only
npm run migrate        # Run database migrations
```

### Device Management

```bash
npm run device:register 00:11:22:33:44:55 "Gate Name" "Location"
npm run device:list    # View all registered devices
```

### API Testing

```bash
npm run test:api                                    # Show available endpoints
npm run test:api login                             # Test authentication
npm run test:api scanRfid '{"tagId":"ABC123","deviceId":"001122334455"}'
```

## Project-Specific Conventions

### Model Associations (Critical Pattern)

Models use **string-based foreign keys** with `constraints: false` to allow unregistered scans:

```javascript
// In models/index.js - always follow this pattern
RfidScan.belongsTo(Rfid, {
  foreignKey: "rfidTagId",
  targetKey: "tagId", // String-based, not numeric ID
  as: "rfidTag",
  constraints: false, // Allows scans of unregistered tags
});
```

### Device Authentication (Dual System)

- **New devices**: Use `Device` model with `deviceId` (MAC without colons)
- **Legacy devices**: Use `ApiKey` model with `type: "device"`
- Controllers check both sources in `deviceController.js`

### Environment Configuration

- Backend: Uses `dotenv` with `.env` + `config/config.json` (Sequelize)
- Frontend: Uses `VITE_API_URL` environment variable
- ESP32: Hardcoded config in `esp32.ino` - modify before flashing

### API Response Format (Enforce Consistency)

```javascript
// Success response
res.json({
  success: true,
  message: "Operation completed",
  data: {
    /* actual data */
  },
});

// Error response
res.status(400).json({
  success: false,
  message: "Error description",
  error: error.message,
});
```

### Trust Proxy Configuration (Required)

Express app MUST include proxy trust for VS Code port forwarding:

```javascript
// In app.js - prevents express-rate-limit errors
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
} else {
  app.set("trust proxy", true); // VS Code port forwarding
}
```

## Integration Points & External Dependencies

### Database Integration

- **Primary**: PostgreSQL with Sequelize ORM
- **Migration strategy**: Use `scripts/migrate-manager.js`, not Sequelize CLI
- **Seeding**: Organized in `seeders/` with index orchestration

### Frontend-Backend Communication

- **API Client**: `frontend/src/services/api.ts` with automatic JWT injection
- **Error Handling**: 401 responses trigger automatic logout/redirect
- **Real-time**: Currently polling-based, WebSocket integration planned

### ESP32 Integration

- **Authentication**: Uses API keys with device-specific prefixes
- **Scanning Modes**: Normal scanning vs registration mode for new tags
- **Heartbeat**: Devices must ping `/api/devices/:deviceId/heartbeat` regularly

## Common Development Patterns

### Adding New Controllers

1. Create in `src/controllers/`
2. Import models from `models/index.js`
3. Add routes in `src/routes/`
4. Update `src/app.js` route registration

### Database Schema Changes

1. Create migration in `migrations/`
2. Update model in `src/models/`
3. Update seeders if needed
4. Run `npm run migrate`

### Frontend Service Integration

1. Add service in `src/services/`
2. Import in components/views
3. Handle loading states and errors consistently
4. Update TypeScript interfaces

## Key Files for Context

- `backend/src/models/index.js` - Model associations and database setup
- `backend/src/controllers/deviceController.js` - Device registration/management patterns
- `backend/scripts/db-manager.js` - Database operations orchestration
- `frontend/src/services/api.ts` - API client configuration
- `esp32.ino` - Hardware integration reference

## Authentication & Security

### Role Hierarchy

- **SuperAdmin**: Full system access
- **Admin**: User/device/RFID management
- **Driver**: Limited dashboard access

### API Security

- JWT tokens with configurable expiration
- Rate limiting with proxy-aware configuration
- API keys for device authentication with SHA256 hashing
- CORS and Helmet middleware standard

Always verify user permissions before database operations and maintain separation between user roles in controller logic.
