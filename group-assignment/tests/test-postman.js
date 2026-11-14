/**
 * ========================================================
 * Postman Collection Test Runner
 * ========================================================
 * Loads postman_collection.json and executes all requests
 * against the live Express server to verify the collection.
 */

const fs = require("fs");
const path = require("path");
const { startServer } = require("../server");

const collectionPath = path.join(__dirname, "..", "postman_collection.json");
const collection = JSON.parse(fs.readFileSync(collectionPath, "utf-8"));

let serverInstance = null;
let passed = 0;
let failed = 0;

const variables = {
  base_url: "http://localhost:3000",
  created_member_id: "1",
  created_locker_id: "1",
  created_allotment_id: "1",
};

function flattenItems(items) {
  let list = [];
  for (const item of items) {
    if (item.item && Array.isArray(item.item)) {
      list = list.concat(flattenItems(item.item));
    } else if (item.request) {
      list.push(item);
    }
  }
  return list;
}

// Expected status code based on request name
function getExpectedStatus(name) {
  if (name.includes("Add a") || name.includes("Create an")) return 201;
  if (name.includes("invalid")) return 400;
  if (name.includes("duplicate")) return 409;
  return 200;
}

async function runPostmanTests() {
  console.log("==================================================");
  console.log("EXECUTING POSTMAN COLLECTION REQUESTS DIRECTLY");
  console.log("Collection: " + collection.info.name);
  console.log("==================================================\n");

  const requests = flattenItems(collection.item);
  console.log(`Found ${requests.length} Postman requests to execute.\n`);

  for (let i = 0; i < requests.length; i++) {
    const reqItem = requests[i];
    const { name, request } = reqItem;
    const method = request.method;

    let url = request.url.raw;
    for (const [k, v] of Object.entries(variables)) {
      url = url.replace(new RegExp(`{{${k}}}`, "g"), v);
    }

    let headers = { "Content-Type": "application/json" };
    if (request.header) {
      for (const h of request.header) {
        headers[h.key] = h.value;
      }
    }

    let body = undefined;
    if (request.body && request.body.raw) {
      let rawBody = request.body.raw;
      for (const [k, v] of Object.entries(variables)) {
        rawBody = rawBody.replace(new RegExp(`{{${k}}}`, "g"), v);
      }
      body = rawBody;
    }

    const expectedStatus = getExpectedStatus(name);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const responseText = await response.text();
      let responseJson = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch (e) {
        responseJson = responseText;
      }

      // Capture variables from responses
      if (name === "Add a member" && responseJson && responseJson.member) {
        variables.created_member_id = responseJson.member.member_id.toString();
      }
      if (name === "Add a locker" && responseJson && responseJson.locker) {
        variables.created_locker_id = responseJson.locker.locker_id.toString();
      }
      if (name === "Create an allotment" && responseJson && responseJson.allotment) {
        variables.created_allotment_id = responseJson.allotment.allotment_id.toString();
      }

      const isMatch = response.status === expectedStatus;

      console.log(`[${i + 1}/${requests.length}] ${method} ${url} -> HTTP ${response.status}`);
      console.log(`     Name: "${name}"`);
      console.log(`     Expected: HTTP ${expectedStatus} | Actual: HTTP ${response.status}`);

      if (isMatch) {
        console.log(`     Result: [PASS]`);
        passed++;
      } else {
        console.error(`     Result: [FAIL] - Expected HTTP ${expectedStatus}, but got ${response.status}`);
        failed++;
      }
    } catch (err) {
      console.error(`     Result: [ERROR] - ${err.message}`);
      failed++;
    }
    console.log("");
  }

  console.log("==================================================");
  console.log(`POSTMAN EXECUTION SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (serverInstance) {
    serverInstance.close();
  }

  process.exit(failed === 0 ? 0 : 1);
}

(async () => {
  try {
    serverInstance = await startServer();
    await runPostmanTests();
  } catch (err) {
    console.error("Failed to run Postman runner:", err);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
})();
