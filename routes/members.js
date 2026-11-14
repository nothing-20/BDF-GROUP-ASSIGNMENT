/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Members Routes
 * ========================================================
 */

const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const { validateMember, validateIdParam } = require("../middleware/validation");

// GET /members - Retrieve all members
router.get("/", memberController.getAllMembers);

// GET /members/:id - Retrieve a member by ID
router.get("/:id", validateIdParam, memberController.getMemberById);

// POST /members - Add a new member
router.post("/", validateMember, memberController.createMember);

// DELETE /members/:id - Delete a member
router.delete("/:id", validateIdParam, memberController.deleteMember);

module.exports = router;
