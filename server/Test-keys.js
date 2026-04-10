import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Test Subject: Rob Liu (CEO of ContactOut) - Guaranteed to be in all B2B databases
const testLinkedin = "https://www.linkedin.com/in/rob-liu";
const testName = "Rob Liu";
const testCompany = "ContactOut";
const testDomain = "contactout.com";

console.log("========================================");
console.log("🧪 STARTING API KEY DIAGNOSTICS");
console.log("========================================\n");

async function runTests() {
  // ---------------------------------------------------------
  // 1. TEST CONTACTOUT (Checks all keys in the array)
  // ---------------------------------------------------------
  console.log("--- 1. CONTACTOUT ---");
  if (!process.env.CONTACTOUT_API_KEYS) {
    console.log("❌ No CONTACTOUT_API_KEYS found in .env (Make sure there is an 'S' at the end!)");
  } else {
    // Split by comma and remove any accidental spaces
    const keys = process.env.CONTACTOUT_API_KEYS.split(',').map(k => k.trim());
    console.log(`Found ${keys.length} ContactOut keys. Testing them all...`);
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const maskedKey = key.length > 4 ? `...${key.slice(-4)}` : "Invalid format";
      
      try {
        const url = `https://api.contactout.com/v1/people/linkedin?profile=${encodeURIComponent(testLinkedin)}`;
        const res = await axios.get(url, { headers: { 'token': key, 'Content-Type': 'application/json' } });
        console.log(`✅ Key ${i + 1} (${maskedKey}): WORKING! Status: 200 OK`);
      } catch (error) {
        const status = error.response ? error.response.status : "Network Error";
        if (status === 401) console.log(`❌ Key ${i + 1} (${maskedKey}): FAILED! (401 Unauthorized - Bad Key)`);
        else if (status === 403) console.log(`⚠️ Key ${i + 1} (${maskedKey}): EMPTY! (403 Forbidden - Zero Credits Left)`);
        else console.log(`❓ Key ${i + 1} (${maskedKey}): ERROR! (Status ${status})`);
      }
    }
  }
  console.log("");

  // ---------------------------------------------------------
  // 2. TEST ROCKET REACH
  // ---------------------------------------------------------
  console.log("--- 2. ROCKET REACH ---");
  if (!process.env.ROCKETREACH_API_KEY) {
    console.log("❌ No ROCKETREACH_API_KEY found in .env");
  } else {
    try {
      const url = `https://api.rocketreach.co/api/v2/person/lookup?linkedin_url=${encodeURIComponent(testLinkedin)}`;
      const res = await axios.get(url, { headers: { 'Api-Key': process.env.ROCKETREACH_API_KEY, 'Content-Type': 'application/json' } });
      console.log(`✅ RocketReach: WORKING! Status: 200 OK`);
    } catch (error) {
      const status = error.response ? error.response.status : "Network Error";
      const errMsg = error.response?.data?.detail || "Make sure your credits aren't empty (403)";
      console.log(`❌ RocketReach: FAILED! (Status ${status}) - ${errMsg}`);
    }
  }
  console.log("");

  // ---------------------------------------------------------
  // 3. TEST APOLLO (Updated with X-Api-Key Header)
  // ---------------------------------------------------------
  console.log("--- 3. APOLLO ---");
  if (!process.env.APOLLO_API_KEY) {
    console.log("❌ No APOLLO_API_KEY found in .env");
  } else {
    try {
      const url = 'https://api.apollo.io/api/v1/people/match';
      const payload = {
        name: testName,
        organization_name: testCompany,
        linkedin_url: testLinkedin
      };

      const res = await axios.post(url, payload, {
        headers: { 
          'Content-Type': 'application/json', 
          'Cache-Control': 'no-cache',
          'X-Api-Key': process.env.APOLLO_API_KEY, // <-- FIXED SECURITY HEADER
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Bot bypass
        }
      });
      console.log(`✅ Apollo: WORKING! Status: 200 OK`);
    } catch (error) {
      const status = error.response ? error.response.status : "Network Error";
      const errMsg = error.response?.data?.error || "Check your API Key or Network.";
      console.log(`❌ Apollo: FAILED! (Status ${status}) - ${errMsg}`);
    }
  }
  console.log("");

  // ---------------------------------------------------------
  // 4. TEST HUNTER
  // ---------------------------------------------------------
  console.log("--- 4. HUNTER ---");
  if (!process.env.HUNTER_API_KEY) {
    console.log("❌ No HUNTER_API_KEY found in .env");
  } else {
    try {
      const url = `https://api.hunter.io/v2/email-finder?domain=${testDomain}&full_name=${encodeURIComponent(testName)}&api_key=${process.env.HUNTER_API_KEY}`;
      const res = await axios.get(url);
      console.log(`✅ Hunter: WORKING! Status: 200 OK`);
    } catch (error) {
      const status = error.response ? error.response.status : "Network Error";
      const errMsg = error.response?.data?.errors?.[0]?.details || "";
      console.log(`❌ Hunter: FAILED! (Status ${status}) - ${errMsg}`);
    }
  }
  
  console.log("\n========================================");
  console.log("🏁 DIAGNOSTICS COMPLETE");
  console.log("========================================");
}

runTests();