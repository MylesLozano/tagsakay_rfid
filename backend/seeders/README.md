# Database Seeder

This directory contains database seeding scripts to populate your TagSakay database with sample data for development and testing.

## Available Seeders

- `userSeeder.js`: Creates sample users (admin, dispatcher, drivers, passengers)
- `rfidSeeder.js`: Creates RFID tags associated with users
- `apiKeySeeder.js`: Creates API keys for different application components
- `rfidScanSeeder.js`: Creates historical RFID scan records
- `index.js`: Exports the seedDatabase function for programmatic use

## Data Relationships

The seeders maintain proper relationships between entities:

1. Users are created first (admin, dispatcher, drivers, passengers)
2. API keys are associated with the admin user
3. RFID tags are linked to driver and passenger users
4. RFID scan records are linked to RFID tags and users

## Customization

To customize the seed data, modify the sample data arrays in each seeder file.
