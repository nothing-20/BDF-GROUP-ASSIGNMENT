/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Lockers Routes
 * ========================================================
 */

const express = require("express");
const router = express.Router();
const lockerController = require("../controllers/lockerController");
const {
  validateLocker,
  validateLockerUpdate,
  validateIdParam,
} = require("../middleware/validation");

// GET /lockers - Retrieve all lockers OR perform smart search (?q=... or ?floor=...)
router.get("/", lockerController.getLockers);

// GET /lockers/:id - Retrieve a locker by ID
router.get("/:id", validateIdParam, lockerController.getLockerById);

// POST /lockers - Add a new locker
router.post("/", validateLocker, lockerController.createLocker);

// PUT /lockers/:id - Update an existing locker
router.put("/:id", validateIdParam, validateLockerUpdate, lockerController.updateLocker);

// DELETE /lockers/:id - Delete a locker
router.delete("/:id", validateIdParam, lockerController.deleteLocker);

module.exports = router;
