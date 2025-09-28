const { Pool } = require("pg");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function resetDatabase() {
  try {
    console.log("🔄 Starting database reset process...");

    // Connect to default postgres database to perform operations
    const pool = new Pool({
      user: "postgres",
      host: "localhost",
      password: "Postgre4017",
      port: 5432,
      database: "postgres",
    });

    // 1. Terminate connections
    console.log("🔌 Terminating existing connections to database...");
    await pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'tagsakay_db' AND pid <> pg_backend_pid();
    `);

    // 2. Drop database if exists
    console.log("💥 Dropping database if it exists...");
    try {
      await pool.query("DROP DATABASE IF EXISTS tagsakay_db;");
      console.log("Database dropped successfully");
    } catch (dropError) {
      console.error("Error dropping database:", dropError.message);
    }

    // 3. Create new database
    console.log("🏗️ Creating fresh database...");
    try {
      await pool.query("CREATE DATABASE tagsakay_db;");
      console.log("Database created successfully");
    } catch (createError) {
      console.error("Error creating database:", createError.message);
      return; // Exit if we can't create the database
    }

    // Close the admin connection pool
    await pool.end();

    console.log("✅ Database reset complete!");
    console.log("");
    console.log('Now you can run "node migrate.js" to run migrations.');
    console.log(
      'Then run "node seeders/index.js" to populate the database with test data.'
    );
  } catch (error) {
    console.error("❌ Error during database reset:", error.message);
    process.exit(1);
  }
}

resetDatabase();
