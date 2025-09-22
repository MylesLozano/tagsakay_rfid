/**
 * Migration to add metadata and type fields to the ApiKey model
 */

const addMetadataAndTypeToApiKey = async (sequelize) => {
  try {
    // Check if the database is SQLite (development) or PostgreSQL (production)
    const dialect = sequelize.getDialect();

    if (dialect === "sqlite") {
      // For SQLite, we need to create a new table with the new columns and copy data
      // This is because SQLite doesn't support ALTER TABLE ADD COLUMN with DEFAULT values

      console.log(
        "Adding metadata and type columns to ApiKey table (SQLite)..."
      );

      // Create a backup of the current data
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "ApiKeys_backup" AS 
        SELECT * FROM "ApiKeys"
      `);

      // Drop the existing table
      await sequelize.query(`DROP TABLE IF EXISTS "ApiKeys"`);

      // Recreate the table with new columns
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "ApiKeys" (
          "id" UUID PRIMARY KEY NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "deviceId" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "key" VARCHAR(64) NOT NULL,
          "prefix" VARCHAR(10) NOT NULL,
          "permissions" TEXT NOT NULL,
          "lastUsed" DATETIME,
          "isActive" BOOLEAN DEFAULT 1,
          "createdBy" INTEGER NOT NULL,
          "metadata" TEXT DEFAULT '{}',
          "type" VARCHAR(255) DEFAULT 'device',
          "createdAt" DATETIME NOT NULL,
          "updatedAt" DATETIME NOT NULL
        )
      `);

      // Restore data from backup
      await sequelize.query(`
        INSERT INTO "ApiKeys" (
          "id", "name", "deviceId", "description", "key", "prefix", 
          "permissions", "lastUsed", "isActive", "createdBy", 
          "createdAt", "updatedAt"
        )
        SELECT 
          "id", "name", "deviceId", "description", "key", "prefix", 
          "permissions", "lastUsed", "isActive", "createdBy", 
          "createdAt", "updatedAt"
        FROM "ApiKeys_backup"
      `);

      // Update the metadata and type fields with default values
      await sequelize.query(`
        UPDATE "ApiKeys" 
        SET "metadata" = '{}', "type" = 'device'
      `);

      // Create indexes
      await sequelize.query(`
        CREATE UNIQUE INDEX "ApiKeys_key_unique" ON "ApiKeys" ("key");
        CREATE INDEX "ApiKeys_deviceId" ON "ApiKeys" ("deviceId");
      `);

      // Drop the backup table
      await sequelize.query(`DROP TABLE IF EXISTS "ApiKeys_backup"`);
    } else {
      // For PostgreSQL or other databases that support ALTER TABLE ADD COLUMN with DEFAULT
      console.log(
        "Adding metadata and type columns to ApiKey table (PostgreSQL)..."
      );

      // Check if metadata column exists
      const [metadataResults] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ApiKeys' AND column_name = 'metadata'
      `);

      if (metadataResults.length === 0) {
        await sequelize.query(`
          ALTER TABLE "ApiKeys" 
          ADD COLUMN "metadata" JSONB DEFAULT '{}' NOT NULL
        `);
      }

      // Check if type column exists
      const [typeResults] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ApiKeys' AND column_name = 'type'
      `);

      if (typeResults.length === 0) {
        await sequelize.query(`
          ALTER TABLE "ApiKeys" 
          ADD COLUMN "type" VARCHAR(255) DEFAULT 'device' NOT NULL
        `);
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

export default addMetadataAndTypeToApiKey;
