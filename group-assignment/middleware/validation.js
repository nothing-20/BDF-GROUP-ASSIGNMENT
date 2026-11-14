/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Input Validation Middleware
 * ========================================================
 * Validates request data before it reaches the controller.
 * Returns HTTP 400 with descriptive error messages when data is invalid.
 */

// Permitted locker status values
const ALLOWED_LOCKER_STATUSES = ["available", "occupied", "maintenance"];

/**
 * Validates data for creating a new member (POST /members)
 */
const validateMember = (req, res, next) => {
  const { name, email } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      error: "Member name is required and cannot be empty.",
    });
  }

  if (!email || typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({
      error: "Member email is required and cannot be empty.",
    });
  }

  next();
};

/**
 * Validates data for creating a new locker (POST /lockers)
 */
const validateLocker = (req, res, next) => {
  const { name, floor, status } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({
      error: "Locker name is required and cannot be empty.",
    });
  }

  if (!floor || typeof floor !== "string" || floor.trim() === "") {
    return res.status(400).json({
      error: "Locker floor is required and cannot be empty.",
    });
  }

  if (status !== undefined) {
    if (!ALLOWED_LOCKER_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid locker status '${status}'. Permitted statuses are: ${ALLOWED_LOCKER_STATUSES.join(", ")}.`,
      });
    }
  }

  next();
};

/**
 * Validates data for updating an existing locker (PUT /lockers/:id)
 */
const validateLockerUpdate = (req, res, next) => {
  const { name, floor, status } = req.body;

  if (name === undefined && floor === undefined && status === undefined) {
    return res.status(400).json({
      error: "At least one field (name, floor, status) must be provided to update.",
    });
  }

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    return res.status(400).json({
      error: "Locker name cannot be empty.",
    });
  }

  if (floor !== undefined && (typeof floor !== "string" || floor.trim() === "")) {
    return res.status(400).json({
      error: "Locker floor cannot be empty.",
    });
  }

  if (status !== undefined && !ALLOWED_LOCKER_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid locker status '${status}'. Permitted statuses are: ${ALLOWED_LOCKER_STATUSES.join(", ")}.`,
    });
  }

  next();
};

/**
 * Validates data for creating a locker allotment (POST /allotments)
 */
const validateAllotment = (req, res, next) => {
  const { member_id, locker_id } = req.body;

  if (member_id === undefined || member_id === null || isNaN(Number(member_id)) || Number(member_id) <= 0) {
    return res.status(400).json({
      error: "Valid member_id is required and must be a positive integer.",
    });
  }

  if (locker_id === undefined || locker_id === null || isNaN(Number(locker_id)) || Number(locker_id) <= 0) {
    return res.status(400).json({
      error: "Valid locker_id is required and must be a positive integer.",
    });
  }

  next();
};

/**
 * Validates ID route parameter (e.g., :id in /lockers/:id or /members/:id)
 */
const validateIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({
      error: "Invalid ID parameter. ID must be a positive integer.",
    });
  }

  next();
};

module.exports = {
  validateMember,
  validateLocker,
  validateLockerUpdate,
  validateAllotment,
  validateIdParam,
};
