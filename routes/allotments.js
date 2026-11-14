/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Allotments Routes
 * ========================================================
 */

const express = require("express");
const router = express.Router();
const allotmentController = require("../controllers/allotmentController");
const { validateAllotment, validateIdParam } = require("../middleware/validation");

// GET /allotments - Retrieve all allotments
router.get("/", allotmentController.getAllAllotments);

// IMPORTANT: GET /allotments/details must be defined BEFORE /:id
// to avoid Express mistaking "details" for an ID parameter!
router.get("/details", allotmentController.getAllotmentDetails);

// GET /allotments/:id - Retrieve an allotment by ID
router.get("/:id", validateIdParam, allotmentController.getAllotmentById);

// POST /allotments - Create a new locker allotment
router.post("/", validateAllotment, allotmentController.createAllotment);

// DELETE /allotments/:id - Delete an allotment (releases locker)
router.delete("/:id", validateIdParam, allotmentController.deleteAllotment);

module.exports = router;
