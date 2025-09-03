import User from "../src/models/User.js";
import bcrypt from "bcrypt";
import logger from "../src/config/logger.js";

// Sample user data
const sampleUsers = [
  {
    name: "System Administrator",
    email: "admin@tagsakay.com",
    password: "Admin@123",
    role: "admin",
    isActive: true,
    rfidTag: null,
  },
  {
    name: "Terminal Dispatcher",
    email: "dispatcher@tagsakay.com",
    password: "Dispatch@123",
    role: "admin", // Using admin since there's no dispatcher role in the model
    isActive: true,
    rfidTag: null,
  },
  {
    name: "Juan Dela Cruz",
    email: "driver1@tagsakay.com",
    password: "Driver@123",
    role: "driver",
    isActive: true,
    rfidTag: "DR0001",
  },
  {
    name: "Pedro Penduko",
    email: "driver2@tagsakay.com",
    password: "Driver@123",
    role: "driver",
    isActive: true,
    rfidTag: "DR0002",
  },
  {
    name: "Maria Santos",
    email: "passenger1@example.com",
    password: "Pass@123",
    role: "driver", // Using driver since passenger role doesn't exist in the model
    isActive: true,
    rfidTag: "PS0001",
  },
];

/**
 * Seeds users into the database
 * @param {Object} options Configuration options
 * @param {boolean} options.resetData Whether to delete existing users before seeding
 * @returns {Promise<Array>} Array of created users
 */
export const seedUsers = async (options = { resetData: false }) => {
  try {
    // Clear existing users if resetData is true
    if (options.resetData) {
      logger.info("Deleting existing users...");
      await User.destroy({ where: {}, force: true });
    }

    // Check if any users already exist
    const userCount = await User.count();
    if (userCount > 0 && !options.resetData) {
      logger.info(`Found ${userCount} existing users, skipping user seeding`);
      return await User.findAll();
    }

    // Create users with hashed passwords
    const createdUsers = [];
    for (const userData of sampleUsers) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create the user with hashed password
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      createdUsers.push(user);
    }

    return createdUsers;
  } catch (error) {
    logger.error("Error seeding users:", error);
    throw error;
  }
};
