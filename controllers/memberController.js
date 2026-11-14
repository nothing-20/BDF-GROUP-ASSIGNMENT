/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Member Controller
 * ========================================================
 * Handles all business logic and database queries for gym members.
 */

const { getDB } = require("../config/database");

/**
 * Retrieve all gym members
 * GET /members
 */
const getAllMembers = async (req, res) => {
  try {
    const db = getDB();
    const members = await db.all("SELECT * FROM members ORDER BY member_id ASC;");
    res.status(200).json(members);
  } catch (error) {
    console.error("Error retrieving members:", error.message);
    res.status(500).json({ error: "Internal server error while retrieving members." });
  }
};

/**
 * Retrieve a single member by member_id
 * GET /members/:id
 */
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    const member = await db.get("SELECT * FROM members WHERE member_id = ?;", [id]);

    if (!member) {
      return res.status(404).json({ error: `Member with ID ${id} not found.` });
    }

    res.status(200).json(member);
  } catch (error) {
    console.error("Error retrieving member:", error.message);
    res.status(500).json({ error: "Internal server error while retrieving member." });
  }
};

/**
 * Add a new gym member
 * POST /members
 */
const createMember = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const db = getDB();

    const query = `
      INSERT INTO members (name, email, phone)
      VALUES (?, ?, ?);
    `;

    const result = await db.run(query, [name.trim(), email.trim(), phone ? phone.trim() : null]);

    const newMember = {
      member_id: result.lastID,
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
    };

    res.status(201).json({
      message: "Member added successfully.",
      member: newMember,
    });
  } catch (error) {
    console.error("Error creating member:", error.message);
    res.status(500).json({ error: "Internal server error while creating member." });
  }
};

/**
 * Delete a member by member_id
 * DELETE /members/:id
 * Prevents deletion if member has an active locker allotment.
 */
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();

    // Check if member exists
    const member = await db.get("SELECT * FROM members WHERE member_id = ?;", [id]);
    if (!member) {
      return res.status(404).json({ error: `Member with ID ${id} not found.` });
    }

    // Check if member currently has an active allotment
    const activeAllotment = await db.get("SELECT * FROM allotments WHERE member_id = ?;", [id]);
    if (activeAllotment) {
      return res.status(409).json({
        error: "Cannot delete member because they currently have an active locker allotment. Please release the allotment first.",
      });
    }

    // Delete member
    await db.run("DELETE FROM members WHERE member_id = ?;", [id]);

    res.status(200).json({
      message: `Member with ID ${id} deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting member:", error.message);
    res.status(500).json({ error: "Internal server error while deleting member." });
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  deleteMember,
};
