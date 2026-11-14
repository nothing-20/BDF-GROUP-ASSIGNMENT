/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Allotment Controller
 * ========================================================
 * Handles all locker allotment operations, including:
 * - Creating allotments with safety checks (maintenance, occupied, duplicate)
 * - Updating locker status to 'occupied' upon allotment
 * - Deleting allotments and resetting locker status to 'available'
 * - SQL JOIN endpoint for complete allotment details
 */

const { getDB } = require("../config/database");

/**
 * Retrieve all raw allotment records
 * GET /allotments
 */
const getAllAllotments = async (req, res) => {
  try {
    const db = getDB();
    const allotments = await db.all("SELECT * FROM allotments ORDER BY allotment_id ASC;");
    res.status(200).json(allotments);
  } catch (error) {
    console.error("Error retrieving allotments:", error.message);
    res.status(500).json({ error: "Internal server error while retrieving allotments." });
  }
};

/**
 * SQL JOIN Endpoint - Important Assignment Requirement
 * Combines allotments, members, and lockers tables to produce comprehensive details.
 * GET /allotments/details
 */
const getAllotmentDetails = async (req, res) => {
  try {
    const db = getDB();

    const query = `
      SELECT 
        allotments.allotment_id,
        allotments.member_id,
        members.name AS member_name,
        allotments.locker_id,
        lockers.name AS locker_name,
        lockers.floor,
        allotments.allotted_at
      FROM allotments
      INNER JOIN members ON allotments.member_id = members.member_id
      INNER JOIN lockers ON allotments.locker_id = lockers.locker_id
      ORDER BY allotments.allotment_id ASC;
    `;

    const details = await db.all(query);
    res.status(200).json(details);
  } catch (error) {
    console.error("Error retrieving allotment details:", error.message);
    res.status(500).json({ error: "Internal server error while retrieving allotment details." });
  }
};

/**
 * Retrieve a single allotment by ID
 * GET /allotments/:id
 */
const getAllotmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const allotment = await db.get("SELECT * FROM allotments WHERE allotment_id = ?;", [id]);

    if (!allotment) {
      return res.status(404).json({ error: `Allotment with ID ${id} not found.` });
    }

    res.status(200).json(allotment);
  } catch (error) {
    console.error("Error retrieving allotment:", error.message);
    res.status(500).json({ error: "Internal server error while retrieving allotment." });
  }
};

/**
 * Create a locker allotment
 * POST /allotments
 *
 * Verification rules:
 * 1. Member exists.
 * 2. Locker exists.
 * 3. Locker status must be 'available'.
 * 4. Locker must not be under maintenance.
 * 5. Locker must not already be allotted.
 * 6. Member must not already have an active allotment.
 *
 * After allotment:
 * - Insert into allotments table.
 * - Update locker status to 'occupied'.
 */
const createAllotment = async (req, res) => {
  try {
    const { member_id, locker_id } = req.body;
    const db = getDB();

    // 1. Verify Member exists
    const member = await db.get("SELECT * FROM members WHERE member_id = ?;", [member_id]);
    if (!member) {
      return res.status(404).json({
        error: `Member with ID ${member_id} does not exist.`,
      });
    }

    // 2. Verify Locker exists
    const locker = await db.get("SELECT * FROM lockers WHERE locker_id = ?;", [locker_id]);
    if (!locker) {
      return res.status(404).json({
        error: `Locker with ID ${locker_id} does not exist.`,
      });
    }

    // 3. Verify Locker is not under maintenance
    if (locker.status === "maintenance") {
      return res.status(400).json({
        error: `Locker '${locker.name}' is currently under maintenance and cannot be allotted.`,
      });
    }

    // 4. Verify Locker is not already occupied
    if (locker.status === "occupied") {
      return res.status(409).json({
        error: `Locker '${locker.name}' is already occupied.`,
      });
    }

    // 5. Verify Locker is not already recorded in allotments table
    const existingLockerAllotment = await db.get(
      "SELECT * FROM allotments WHERE locker_id = ?;",
      [locker_id]
    );
    if (existingLockerAllotment) {
      return res.status(409).json({
        error: `Locker '${locker.name}' is already allotted to another member.`,
      });
    }

    // 6. Verify Member does not already have an active locker allotment
    const existingMemberAllotment = await db.get(
      "SELECT * FROM allotments WHERE member_id = ?;",
      [member_id]
    );
    if (existingMemberAllotment) {
      return res.status(409).json({
        error: `Member '${member.name}' already has an active locker allotment (Locker ID: ${existingMemberAllotment.locker_id}).`,
      });
    }

    // Insert new allotment record
    const insertQuery = `
      INSERT INTO allotments (member_id, locker_id)
      VALUES (?, ?);
    `;
    const result = await db.run(insertQuery, [member_id, locker_id]);

    // Update locker status to 'occupied'
    await db.run("UPDATE lockers SET status = 'occupied' WHERE locker_id = ?;", [locker_id]);

    // Fetch the newly inserted record to return accurate timestamp
    const newAllotment = await db.get("SELECT * FROM allotments WHERE allotment_id = ?;", [
      result.lastID,
    ]);

    res.status(201).json({
      message: "Locker allotted successfully.",
      allotment: newAllotment,
    });
  } catch (error) {
    console.error("Error creating allotment:", error.message);
    res.status(500).json({ error: "Internal server error while creating allotment." });
  }
};

/**
 * Delete an allotment (Release locker)
 * DELETE /allotments/:id
 *
 * Rules:
 * - Remove the allotment record.
 * - Update the locker status to 'available', provided it is not under maintenance.
 */
const deleteAllotment = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if allotment exists
    const allotment = await db.get("SELECT * FROM allotments WHERE allotment_id = ?;", [id]);
    if (!allotment) {
      return res.status(404).json({ error: `Allotment with ID ${id} not found.` });
    }

    const { locker_id } = allotment;

    // Remove the allotment record
    await db.run("DELETE FROM allotments WHERE allotment_id = ?;", [id]);

    // Check locker's current status:
    // Update to 'available' provided it is not under maintenance
    const locker = await db.get("SELECT * FROM lockers WHERE locker_id = ?;", [locker_id]);
    if (locker && locker.status !== "maintenance") {
      await db.run("UPDATE lockers SET status = 'available' WHERE locker_id = ?;", [locker_id]);
    }

    res.status(200).json({
      message: "Allotment deleted successfully and locker status updated to available.",
    });
  } catch (error) {
    console.error("Error deleting allotment:", error.message);
    res.status(500).json({ error: "Internal server error while deleting allotment." });
  }
};

module.exports = {
  getAllAllotments,
  getAllotmentDetails,
  getAllotmentById,
  createAllotment,
  deleteAllotment,
};
