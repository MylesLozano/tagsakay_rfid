import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

console.log("🔄 Starting database reset process...");

async function resetDatabase() {
  try {
    console.log("💥 Dropping database if it exists...");
    try {
      const { stdout: dropOutput } = await execPromise(
        "npx sequelize-cli db:drop"
      );
      console.log(dropOutput);
    } catch (dropError) {
      console.log("Database may not exist yet, proceeding...");
    }

    console.log("🏗️ Creating fresh database...");
    const { stdout: createOutput } = await execPromise(
      "npx sequelize-cli db:create"
    );
    console.log(createOutput);

    console.log("🚀 Running all migrations...");
    const { stdout: migrateOutput } = await execPromise(
      "npx sequelize-cli db:migrate"
    );
    console.log(migrateOutput);

    console.log("🌱 Seeding database with initial data...");
    try {
      const { stdout: seedOutput } = await execPromise(
        "npx sequelize-cli db:seed:all"
      );
      console.log(seedOutput);
    } catch (seedError) {
      console.warn("⚠️ Warning with seeding:", seedError.message);
    }

    console.log("✅ Database reset complete!");
  } catch (error) {
    console.error("❌ Error during database reset:", error);
    process.exit(1);
  }
}

resetDatabase();
