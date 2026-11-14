const { initializeDatabase, getDB } = require("../config/database");

async function testDatabase() {
  console.log("Testing database initialization...");
  await initializeDatabase();
  const db = getDB();

  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
  console.log("Database tables found:", tables.map(t => t.name));

  const members = await db.all("SELECT * FROM members;");
  console.log(`Members in DB (${members.length}):`, members);

  const lockers = await db.all("SELECT * FROM lockers;");
  console.log(`Lockers in DB (${lockers.length}):`, lockers);

  console.log("Database verification complete!");
}

testDatabase().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
