/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Locker Controller
 * ========================================================
 * Implements all CRUD operations for lockers and the custom
 * Smart Search feature using SQLite LOWER() and LIKE.
 */

const { getDB } = require("../config/database");

/**
 * Retrieve all lockers OR perform custom Smart Search based on query parameters.
 * GET /lockers
 * GET /lockers?q=word
 * GET /lockers?floor=Ground
 *
 * Requirements:
 * - Search locker names and floors.
 * - Match anywhere in text using LIKE '%word%'.
 * - Case-insensitive using LOWER().
 * - When no matches are found, MUST return HTTP 200 with:
 *   { "lockers": [], "message": "Nothing found" }
 * - If no query parameters, return all lockers.
 */
const getLockers = async (req, res) => {
  try {
    const db = getDB();
    const { q, floor } = req.query;

    // Case 1: Custom Smart Search using query parameter 'q'
    if (q !== undefined) {
      const searchTerm = `%${q.trim().toLowerCase()}%`;
      const query = `
        SELECT * FROM lockers
        WHERE LOWER(name) LIKE ? OR LOWER(floor) LIKE ?
        ORDER BY locker_id ASC;
      `;
      const lockers = await db.all(query, [searchTerm, searchTerm]);

      // If no lockers match the search term
      if (lockers.length === 0) {
        return res.status(200).json({
          lockers: [],
          message: "Nothing found",
        });
      }

      return res.status(200).json(lockers);
    }

    // Case 2: Filter by floor using query parameter 'floor'
    if (floor !== undefined) {
      const floorTerm = `%${floor.trim().toLowerCase()}%`;
      const query = `
        SELECT * FROM lockers
        WHERE LOWER(floor) LIKE ?
        ORDER BY locker_id ASC;
      `;
      const lockers = await db.all(query, [floorTerm]);

      if (lockers.length === 0) {
        return res.status(200).json({
          lockers: [],
          message: "Nothing found",
        });
      }

      return res.status(200).json(lockers);
    }

    // Case 3: No query parameters - return all lockers
    const lockers = await db.all("SELECT * FROM lockers ORDER BY locker_id ASC;");
    res.status(200).json(lockers);
  } catch (error) {
    console.error("Error retrieving lockers:", error.message);
    res.status(500).json({ error: "Internal server error while retrieving lockers." });
  }
};

/**
 * Retrieve a single locker by locker_id
 * GET /lockers/:id
 */
const getLockerById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const locker = await db.get("SELECT * FROM lockers WHERE locker_id = ?;", [id]);

    if (!locker) {
      return res.status(404).json({ error: `Locker with ID ${id} not found.` });
    }

    res.status(200).json(locker);
  } catch (error) {
    console.error("Error retrieving locker:", error.message);
    res.status(500).json({ error: "Internal server error while retrieving locker." });
  }
};

/**
 * Add a new locker
 * POST /lockers
 */
const createLocker = async (req, res) => {
  try {
    const { name, floor, status } = req.body;
    const db = getDB();

    // Default status to 'available' if not provided
    const lockerStatus = status ? status.trim() : "available";

    const query = `
      INSERT INTO lockers (name, floor, status)
      VALUES (?, ?, ?);
    `;

    const result = await db.run(query, [name.trim(), floor.trim(), lockerStatus]);

    const newLocker = {
      locker_id: result.lastID,
      name: name.trim(),
      floor: floor.trim(),
      status: lockerStatus,
    };

    res.status(201).json({
      message: "Locker created successfully.",
      locker: newLocker,
    });
  } catch (error) {
    console.error("Error creating locker:", error.message);
    res.status(500).json({ error: "Internal server error while creating locker." });
  }
};

/**
 * Update an existing locker
 * PUT /lockers/:id
 *
 * Rules:
 * - Do not allow an occupied locker or a locker with an active allotment to be
 *   incorrectly changed to available or maintenance.
 */
const updateLocker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, floor, status } = req.body;
    const db = getDB();

    // Check if locker exists
    const existingLocker = await db.get("SELECT * FROM lockers WHERE locker_id = ?;", [id]);
    if (!existingLocker) {
      return res.status(404).json({ error: `Locker with ID ${id} not found.` });
    }

    // Check if there is an active allotment for this locker
    const activeAllotment = await db.get("SELECT * FROM allotments WHERE locker_id = ?;", [id]);

    // If active allotment exists, prevent changing status to 'available' or 'maintenance'
    if (activeAllotment && status && status !== "occupied") {
      return res.status(409).json({
        error: `Cannot change locker status to '${status}' while an active allotment exists. Please delete the allotment first.`,
      });
    }

    // Prepare updated values (retaining existing if not provided)
    const updatedName = name !== undefined ? name.trim() : existingLocker.name;
    const updatedFloor = floor !== undefined ? floor.trim() : existingLocker.floor;
    const updatedStatus = status !== undefined ? status.trim() : existingLocker.status;

    const query = `
      UPDATE lockers
      SET name = ?, floor = ?, status = ?
      WHERE locker_id = ?;
    `;

    await db.run(query, [updatedName, updatedFloor, updatedStatus, id]);

    const updatedLocker = {
      locker_id: Number(id),
      name: updatedName,
      floor: updatedFloor,
      status: updatedStatus,
    };

    res.status(200).json({
      message: "Locker updated successfully.",
      locker: updatedLocker,
    });
  } catch (error) {
    console.error("Error updating locker:", error.message);
    res.status(500).json({ error: "Internal server error while updating locker." });
  }
};

/**
 * Delete a locker
 * DELETE /lockers/:id
 *
 * Rules:
 * - Prevent deletion when an active allotment exists (HTTP 409).
 */
const deleteLocker = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if locker exists
    const locker = await db.get("SELECT * FROM lockers WHERE locker_id = ?;", [id]);
    if (!locker) {
      return res.status(404).json({ error: `Locker with ID ${id} not found.` });
    }

    // Check if locker has an active allotment
    const activeAllotment = await db.get("SELECT * FROM allotments WHERE locker_id = ?;", [id]);
    if (activeAllotment) {
      return res.status(409).json({
        error: "Cannot delete locker because it currently has an active allotment. Please delete the allotment first.",
      });
    }

    // Delete the locker
    await db.run("DELETE FROM lockers WHERE locker_id = ?;", [id]);

    res.status(200).json({
      message: `Locker with ID ${id} deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting locker:", error.message);
    res.status(500).json({ error: "Internal server error while deleting locker." });
  }
};

module.exports = {
  getLockers,
  getLockerById,
  createLocker,
  updateLocker,
  deleteLocker,
};
