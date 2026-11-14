/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Database Configuration and Initialization Module
 * ========================================================
 * This module uses the official 'sqlite' and 'sqlite3' packages
 * taught in Module 3 of Backend Development Fundamentals.
 */

const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

// Path to SQLite database file and schema file
const dbPath = path.join(__dirname, "..", "fitnest.db");
const schemaPath = path.join(__dirname, "..", "database", "schema.sql");

let dbInstance = null;

/**
 * Initializes the SQLite database connection, enables foreign key support,
 * creates all necessary tables using schema.sql, and seeds initial data if empty.
 * @returns {Promise<object>} The active database connection instance
 */
const initializeDatabase = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Open SQLite database connection
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // IMPORTANT: Enable foreign key constraints in SQLite
    // By default, SQLite has foreign key constraints disabled.
    await dbInstance.run("PRAGMA foreign_keys = ON;");

    // Read and execute schema.sql to create the 3 required tables
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    await dbInstance.exec(schemaSql);

    // Seed sample data if tables are brand new and empty
    await seedInitialData(dbInstance);

    return dbInstance;
  } catch (error) {
    console.error("Database initialization failed:", error.message);
    throw error;
  }
};

/**
 * Helper function to seed initial records for easy testing and demonstration.
 * @param {object} db - Active database connection
 */
const seedInitialData = async (db) => {
  const memberCount = await db.get("SELECT COUNT(*) AS count FROM members;");
  if (memberCount.count === 0) {
    await db.run(
      `INSERT INTO members (name, email, phone) VALUES 
       ('Rahul', 'rahul@example.com', '9876543210'),
       ('Sneha Sharma', 'sneha@example.com', '9876543211'),
       ('Amit Patel', 'amit@example.com', '9876543212');`
    );
  }

  const lockerCount = await db.get("SELECT COUNT(*) AS count FROM lockers;");
  if (lockerCount.count === 0) {
    await db.run(
      `INSERT INTO lockers (name, floor, status) VALUES 
       ('Locker A1', 'Ground Floor', 'available'),
       ('Locker A2', 'Ground Floor', 'available'),
       ('Locker B1', 'First Floor', 'available'),
       ('Locker B2', 'First Floor', 'maintenance');`
    );
  }
};

/**
 * Returns the active database instance.
 * Throws an error if initializeDatabase() has not been executed yet.
 * @returns {object} The active database instance
 */
const getDB = () => {
  if (!dbInstance) {
    throw new Error("Database has not been initialized. Please call initializeDatabase() first.");
  }
  return dbInstance;
};

module.exports = {
  initializeDatabase,
  getDB,
};
