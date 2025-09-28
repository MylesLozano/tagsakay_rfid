import pg from "pg";
const { Client } = pg;

async function terminateConnections() {
  try {
    console.log("Connecting to PostgreSQL...");
    const client = new Client({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "Postgre4017",
      database: "postgres", // Connect to default database
    });

    await client.connect();
    console.log("Connected! Terminating connections to tagsakay_db...");

    // SQL to terminate all connections to our database
    const result = await client.query(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'tagsakay_db' AND pid <> pg_backend_pid();
    `);

    console.log(`Terminated ${result.rowCount} connections`);
    await client.end();

    console.log("Now we can drop the database");
  } catch (error) {
    console.error("Error terminating connections:", error);
  }
}

terminateConnections();
