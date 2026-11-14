/**
 * ========================================================
 * FitNest Gym – Locker Management System
 * Main Express Application Server
 * ========================================================
 * Backend Development Fundamentals (Modules 1, 2, 3)
 */

const express = require("express");
const { initializeDatabase } = require("./config/database");

// Import route modules
const membersRoutes = require("./routes/members");
const lockersRoutes = require("./routes/lockers");
const allotmentsRoutes = require("./routes/allotments");

// Initialize Express server instance
const app = express();
const PORT = process.env.PORT || 3000;

// Built-in middleware to parse incoming JSON request bodies
app.use(express.json());

// Root welcome route
app.get("/", (req, res) => {
  res.status(200).json({
    project: "FitNest Gym – Locker Management System",
    description: "Backend Development Fundamentals Project (Modules 1, 2, 3)",
    status: "Active and Running",
    endpoints: {
      members: "/members",
      lockers: "/lockers",
      smartSearch: "/lockers?q={search_term}",
      floorSearch: "/lockers?floor={floor_name}",
      allotments: "/allotments",
      allotmentDetails: "/allotments/details",
    },
  });
});

// Mount separate route modules
app.use("/members", membersRoutes);
app.use("/lockers", lockersRoutes);
app.use("/allotments", allotmentsRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message,
  });
});

// Initialize SQLite database before accepting incoming requests
const startServer = async () => {
  try {
    await initializeDatabase();
    console.log("==================================================");
    console.log("FitNest Gym - Locker Management System");
    console.log("Database 'fitnest.db' connected and initialized.");
    console.log(`Server is running successfully on http://localhost:${PORT}`);
    console.log("==================================================");

    const server = app.listen(PORT);
    return server;
  } catch (error) {
    console.error("Failed to initialize database and start server:", error);
    process.exit(1);
  }
};

// Start the server if this file is executed directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
