const crypto = require("crypto");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Load .env file
function loadEnvFile() {
  const envFiles = [".env.local", ".env"];
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      break;
    }
  }
}

loadEnvFile();

const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.error("❌ Error: ZOOM_WEBHOOK_SECRET not found in .env files");
  process.exit(1);
}

// Test multiple events
const testEvents = [
  {
    name: "Participant Joined",
    payload: {
      event: "meeting.participant_joined",
      payload: {
        account_id: "test_account_123",
        account_email: "test@example.com",
        object: {
          id: "60c987a4-a979-4764-9181-3b3ee748d3f4",
          uuid: "60c987a4-a979-4764-9181-3b3ee748d3f4",
          host_id: "test_host_123",
          topic: "Test Meeting",
          meeting_number: "123456789",
          participant: {
            user_id: "a1b2c3d4-e5f6-4789-a012-345678901234",
            user_name: "Test Participant",
            email: "participant@example.com",
            join_time: new Date().toISOString(),
          },
        },
      },
    },
  },
  {
    name: "Participant Left",
    payload: {
      event: "meeting.participant_left",
      payload: {
        account_id: "test_account_123",
        account_email: "test@example.com",
        object: {
          id: "60c987a4-a979-4764-9181-3b3ee748d3f4",
          uuid: "60c987a4-a979-4764-9181-3b3ee748d3f4",
          host_id: "test_host_123",
          topic: "Test Meeting",
          meeting_number: "123456789",
          participant: {
            user_id: "a1b2c3d4-e5f6-4789-a012-345678901234",
            user_name: "Test Participant",
            email: "participant@example.com",
            leave_time: new Date().toISOString(),
            leave_reason: "Left the meeting",
          },
        },
      },
    },
  },
  {
    name: "Meeting Started",
    payload: {
      event: "meeting.started",
      payload: {
        account_id: "test_account_123",
        object: {
          id: "60c987a4-a979-4764-9181-3b3ee748d3f4",
          uuid: "60c987a4-a979-4764-9181-3b3ee748d3f4",
          host_id: "test_host_123",
          topic: "Test Meeting",
          meeting_number: "123456789",
          start_time: new Date().toISOString(),
        },
      },
    },
  },
];

function sendRequest(payload, eventName) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now().toString();
    const bodyString = JSON.stringify(payload);
    const message = `v0:${timestamp}:${bodyString}`;
    const signature = `v0=${crypto
      .createHmac("sha256", webhookSecret)
      .update(message)
      .digest("hex")}`;

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/zoom/webhooks",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zm-signature": signature,
        "x-zm-request-timestamp": timestamp,
        Authorization: `Bearer ${webhookSecret}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on("error", reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runTests() {
  console.log("🧪 Testing Zoom Webhook with Multiple Events\n");

  for (const testEvent of testEvents) {
    console.log(`📤 Sending: ${testEvent.name}...`);
    try {
      const result = await sendRequest(testEvent.payload, testEvent.name);
      const response = JSON.parse(result.data);
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   Response: ${JSON.stringify(response)}\n`);

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log("✅ All tests completed! Check PostHog for logged events.");
}

runTests();
