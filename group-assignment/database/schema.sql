-- ========================================================
-- FitNest Gym - Locker Management System
-- SQLite Database Schema Definition
-- ========================================================

-- Enable Foreign Key Support in SQLite
PRAGMA foreign_keys = ON;

-- --------------------------------------------------------
-- TABLE 1: members
-- Stores gym member details
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    member_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT
);

-- --------------------------------------------------------
-- TABLE 2: lockers
-- Stores gym locker details and current availability status
-- Permitted statuses: 'available', 'occupied', 'maintenance'
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS lockers (
    locker_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    floor TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('available', 'occupied', 'maintenance'))
);

-- --------------------------------------------------------
-- TABLE 3: allotments
-- Stores active locker allotment records for members
-- Each locker can only be assigned to one member at a time (UNIQUE)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS allotments (
    allotment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL,
    locker_id INTEGER NOT NULL UNIQUE,
    allotted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE RESTRICT,
    FOREIGN KEY (locker_id) REFERENCES lockers(locker_id) ON DELETE RESTRICT
);
