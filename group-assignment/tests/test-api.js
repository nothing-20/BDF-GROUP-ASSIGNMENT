/**
 * ========================================================
 * FitNest Gym - Locker Management System
 * Comprehensive API Test Suite
 * ========================================================
 * Tests every API endpoint, status code, validation rule,
 * custom smart search, SQL JOIN, and business constraint.
 */

const { startServer } = require("../server");

const BASE_URL = "http://localhost:3000";

let serverInstance = null;
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${testName}: ${details}`);
    failedCount++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data };
}

async function runTests() {
  console.log("\n========================================================");
  console.log("STARTING FITNEST GYM API TEST SUITE");
  console.log("========================================================\n");

  // 1. Root Endpoint Test
  console.log("--- 1. Server Root Endpoint ---");
  const rootRes = await request("/");
  assert(rootRes.status === 200, "GET / returns HTTP 200", `Got ${rootRes.status}`);
  assert(rootRes.data.project.includes("FitNest Gym"), "GET / returns project info");

  // 2. Members Endpoints
  console.log("\n--- 2. Member Endpoints ---");
  const membersRes = await request("/members");
  assert(membersRes.status === 200, "GET /members returns HTTP 200", `Got ${membersRes.status}`);
  assert(Array.isArray(membersRes.data) && membersRes.data.length >= 3, "GET /members returns list of members");

  const singleMemberRes = await request("/members/1");
  assert(singleMemberRes.status === 200, "GET /members/1 returns HTTP 200", `Got ${singleMemberRes.status}`);
  assert(singleMemberRes.data.member_id === 1, "GET /members/1 returns member with ID 1");

  const invalidMemberRes = await request("/members/9999");
  assert(invalidMemberRes.status === 404, "GET /members/9999 returns HTTP 404", `Got ${invalidMemberRes.status}`);

  // Test Member Creation Validation
  const invalidCreateMember = await request("/members", {
    method: "POST",
    body: JSON.stringify({ name: "", email: "" }),
  });
  assert(invalidCreateMember.status === 400, "POST /members with empty fields returns HTTP 400", `Got ${invalidCreateMember.status}`);

  // Valid Member Creation
  const newMemberRes = await request("/members", {
    method: "POST",
    body: JSON.stringify({
      name: "Pooja Hegde",
      email: "pooja@example.com",
      phone: "9811223344",
    }),
  });
  assert(newMemberRes.status === 201, "POST /members returns HTTP 201 Created", `Got ${newMemberRes.status}`);
  const createdMemberId = newMemberRes.data.member.member_id;
  assert(createdMemberId > 0, `Member created with ID ${createdMemberId}`);

  // 3. Lockers Endpoints & CRUD
  console.log("\n--- 3. Locker Endpoints & CRUD ---");
  const lockersRes = await request("/lockers");
  assert(lockersRes.status === 200, "GET /lockers returns HTTP 200", `Got ${lockersRes.status}`);
  assert(Array.isArray(lockersRes.data) && lockersRes.data.length >= 4, "GET /lockers returns list of lockers");

  const singleLockerRes = await request("/lockers/1");
  assert(singleLockerRes.status === 200, "GET /lockers/1 returns HTTP 200", `Got ${singleLockerRes.status}`);
  assert(singleLockerRes.data.locker_id === 1, "GET /lockers/1 returns correct locker");

  // Create Locker Validation
  const invalidLockerRes = await request("/lockers", {
    method: "POST",
    body: JSON.stringify({ name: "", floor: "" }),
  });
  assert(invalidLockerRes.status === 400, "POST /lockers with empty fields returns HTTP 400", `Got ${invalidLockerRes.status}`);

  const invalidStatusLocker = await request("/lockers", {
    method: "POST",
    body: JSON.stringify({ name: "Locker X", floor: "Ground Floor", status: "invalid_status" }),
  });
  assert(invalidStatusLocker.status === 400, "POST /lockers with invalid status returns HTTP 400", `Got ${invalidStatusLocker.status}`);

  // Create Valid Locker
  const createLockerRes = await request("/lockers", {
    method: "POST",
    body: JSON.stringify({
      name: "Locker Temp",
      floor: "Second Floor",
      status: "available",
    }),
  });
  assert(createLockerRes.status === 201, "POST /lockers returns HTTP 201 Created", `Got ${createLockerRes.status}`);
  const tempLockerId = createLockerRes.data.locker.locker_id;

  // Update Locker (PUT /lockers/:id)
  const updateLockerRes = await request(`/lockers/${tempLockerId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "Locker C1",
      floor: "Second Floor",
    }),
  });
  assert(updateLockerRes.status === 200, "PUT /lockers/:id returns HTTP 200", `Got ${updateLockerRes.status}`);
  assert(updateLockerRes.data.locker.name === "Locker C1", "Locker name was updated to 'Locker C1'");

  // Delete Locker (DELETE /lockers/:id)
  const deleteTempRes = await request(`/lockers/${tempLockerId}`, {
    method: "DELETE",
  });
  assert(deleteTempRes.status === 200, "DELETE /lockers/:id returns HTTP 200 for unallotted locker", `Got ${deleteTempRes.status}`);

  // 4. Custom Feature - Smart Search Requirements
  console.log("\n--- 4. Custom Smart Search Requirements ---");
  // Test Case 1: Lowercase search
  const searchLower = await request("/lockers?q=locker");
  assert(searchLower.status === 200, "GET /lockers?q=locker returns HTTP 200", `Got ${searchLower.status}`);
  assert(Array.isArray(searchLower.data) && searchLower.data.length > 0, "GET /lockers?q=locker returns matching lockers");

  // Test Case 2: Uppercase search (must return identical results)
  const searchUpper = await request("/lockers?q=LOCKER");
  assert(searchUpper.status === 200, "GET /lockers?q=LOCKER returns HTTP 200", `Got ${searchUpper.status}`);
  assert(
    JSON.stringify(searchLower.data) === JSON.stringify(searchUpper.data),
    "GET /lockers?q=LOCKER returns exactly same results as ?q=locker"
  );

  // Test Case 3: No matches found (GET /lockers?q=zzz)
  const searchNoMatch = await request("/lockers?q=zzz");
  assert(searchNoMatch.status === 200, "GET /lockers?q=zzz returns HTTP 200 (NOT 404)", `Got ${searchNoMatch.status}`);
  assert(
    Array.isArray(searchNoMatch.data.lockers) && searchNoMatch.data.lockers.length === 0,
    "GET /lockers?q=zzz contains empty lockers array 'lockers: []'"
  );
  assert(
    searchNoMatch.data.message === "Nothing found",
    `GET /lockers?q=zzz message is exactly 'Nothing found' (Got '${searchNoMatch.data.message}')`
  );

  // Test Case 4: Search by floor
  const searchFloor = await request("/lockers?floor=Ground");
  assert(searchFloor.status === 200, "GET /lockers?floor=Ground returns HTTP 200", `Got ${searchFloor.status}`);
  assert(Array.isArray(searchFloor.data) && searchFloor.data.length > 0, "GET /lockers?floor=Ground returns matching floor lockers");

  // 5. Allotment Endpoints & Business Logic
  console.log("\n--- 5. Allotment Endpoints & Business Rules ---");
  // Test Allotment Validation
  const invalidAllotmentInput = await request("/allotments", {
    method: "POST",
    body: JSON.stringify({ member_id: "abc", locker_id: null }),
  });
  assert(invalidAllotmentInput.status === 400, "POST /allotments with invalid IDs returns HTTP 400", `Got ${invalidAllotmentInput.status}`);

  // Test Allotment to non-existent member
  const nonExistentMemberAllot = await request("/allotments", {
    method: "POST",
    body: JSON.stringify({ member_id: 9999, locker_id: 2 }),
  });
  assert(nonExistentMemberAllot.status === 404, "POST /allotments for non-existent member returns HTTP 404", `Got ${nonExistentMemberAllot.status}`);

  // Test Allotment to maintenance locker (Locker 4 is under maintenance)
  const maintenanceAllot = await request("/allotments", {
    method: "POST",
    body: JSON.stringify({ member_id: 1, locker_id: 4 }),
  });
  assert(maintenanceAllot.status === 400, "POST /allotments for maintenance locker returns HTTP 400", `Got ${maintenanceAllot.status}`);

  // Create valid allotment: Member 1 allots Locker 2
  const validAllotmentRes = await request("/allotments", {
    method: "POST",
    body: JSON.stringify({ member_id: 1, locker_id: 2 }),
  });
  assert(validAllotmentRes.status === 201, "POST /allotments returns HTTP 201 Created", `Got ${validAllotmentRes.status}`);
  const createdAllotmentId = validAllotmentRes.data.allotment.allotment_id;

  // Verify locker 2 status is now 'occupied'
  const verifyLockerStatus = await request("/lockers/2");
  assert(verifyLockerStatus.data.status === "occupied", "Locker 2 status updated to 'occupied' after allotment");

  // Test duplicate locker allotment: Try to allot Locker 2 again to Member 2 -> must return 409
  const duplicateLockerAllot = await request("/allotments", {
    method: "POST",
    body: JSON.stringify({ member_id: 2, locker_id: 2 }),
  });
  assert(duplicateLockerAllot.status === 409, "POST /allotments for occupied locker returns HTTP 409 Conflict", `Got ${duplicateLockerAllot.status}`);

  // Test duplicate member allotment: Try to allot Locker 3 to Member 1 (who already has Locker 2) -> 409
  const duplicateMemberAllot = await request("/allotments", {
    method: "POST",
    body: JSON.stringify({ member_id: 1, locker_id: 3 }),
  });
  assert(duplicateMemberAllot.status === 409, "POST /allotments for member with active allotment returns HTTP 409 Conflict", `Got ${duplicateMemberAllot.status}`);

  // Test attempting to change occupied locker status to available via PUT -> must return 409
  const invalidStatusChange = await request("/lockers/2", {
    method: "PUT",
    body: JSON.stringify({ status: "available" }),
  });
  assert(invalidStatusChange.status === 409, "PUT /lockers/2 changing occupied locker to available returns HTTP 409 Conflict", `Got ${invalidStatusChange.status}`);

  // Test attempting to delete locker with active allotment -> must return 409
  const deleteOccupiedLocker = await request("/lockers/2", {
    method: "DELETE",
  });
  assert(deleteOccupiedLocker.status === 409, "DELETE /lockers/2 with active allotment returns HTTP 409 Conflict", `Got ${deleteOccupiedLocker.status}`);

  // Test attempting to delete member with active allotment -> must return 409
  const deleteAllottedMember = await request("/members/1", {
    method: "DELETE",
  });
  assert(deleteAllottedMember.status === 409, "DELETE /members/1 with active allotment returns HTTP 409 Conflict", `Got ${deleteAllottedMember.status}`);

  // 6. SQL JOIN Endpoint
  console.log("\n--- 6. SQL JOIN Endpoint (GET /allotments/details) ---");
  const joinRes = await request("/allotments/details");
  assert(joinRes.status === 200, "GET /allotments/details returns HTTP 200", `Got ${joinRes.status}`);
  assert(Array.isArray(joinRes.data) && joinRes.data.length > 0, "GET /allotments/details returns non-empty array");

  const firstJoinRow = joinRes.data[0];
  assert(
    firstJoinRow.allotment_id !== undefined &&
    firstJoinRow.member_id !== undefined &&
    firstJoinRow.member_name !== undefined &&
    firstJoinRow.locker_id !== undefined &&
    firstJoinRow.locker_name !== undefined &&
    firstJoinRow.floor !== undefined &&
    firstJoinRow.allotted_at !== undefined,
    "GET /allotments/details includes allotment_id, member_id, member_name, locker_id, locker_name, floor, allotted_at"
  );
  console.log("  JOIN sample output row:", firstJoinRow);

  // 7. Delete Allotment & Verify Locker Status Reset
  console.log("\n--- 7. Delete Allotment & Status Reset ---");
  const deleteAllotmentRes = await request(`/allotments/${createdAllotmentId}`, {
    method: "DELETE",
  });
  assert(deleteAllotmentRes.status === 200, "DELETE /allotments/:id returns HTTP 200", `Got ${deleteAllotmentRes.status}`);

  // Verify Locker 2 status reset to 'available'
  const verifyResetLocker = await request("/lockers/2");
  assert(verifyResetLocker.data.status === "available", "Locker 2 status reset to 'available' after allotment deletion");

  // Summary
  console.log("\n========================================================");
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("========================================================\n");

  if (serverInstance) {
    serverInstance.close();
  }

  process.exit(failedCount === 0 ? 0 : 1);
}

// Start server and run tests
(async () => {
  try {
    serverInstance = await startServer();
    await runTests();
  } catch (error) {
    console.error("Test execution failed:", error);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
})();
