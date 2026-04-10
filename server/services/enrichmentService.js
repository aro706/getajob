import axios from "axios";
import Resume from "../models/Resume.js";
import dotenv from "dotenv";
import Company from "../models/Company.js";

dotenv.config();

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

// ---------------- UTILS ----------------
function clean(s) {
  if (!s) return "";
  return s.replace(/[^a-z]/gi, "").toLowerCase();
}

// ---------------- DOMAIN LOOKUP ----------------
async function getDomain(company) {
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`;
    const res = await axios.get(url, { timeout: 3000 });

    if (res.data && res.data.length > 0) {
      return res.data[0].domain;
    }
  } catch (error) {
    console.error(`Clearbit lookup failed for ${company}`);
  }

  // Fallback: simple cleanup if API fails
  const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanName}.com`;
}

// ---------------- HUNTER (PRIMARY ENGINE) ----------------
async function tryHunter(name, domain) {
  if (!HUNTER_API_KEY) {
    console.warn("Hunter API Key missing.");
    return null;
  }

  try {
    // We use full_name for better accuracy or split if needed
    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&full_name=${encodeURIComponent(name)}&api_key=${HUNTER_API_KEY}`;

    const res = await axios.get(url, { timeout: 4000 });
    const data = res.data.data;

    // Use a confidence threshold of 70 to ensure quality
    if (data && data.email && data.score >= 70) {
      return {
        email: data.email,
        source: "hunter.io",
        confidence: data.score
      };
    }
    return null;
  } catch (error) {
    console.log("Hunter.io request failed or no email found.");
    return null;
  }
}

// ---------------- FALLBACK GENERATOR ----------------
function fallback(name, domain) {
  const parts = name.split(" ").map(clean);
  const first = parts[0] || "";
  const last = parts[1] || "";

  return {
    email: last ? `${first}.${last}@${domain}` : `${first}@${domain}`,
    source: "pattern_prediction",
    confidence: 30
  };
}

// ---------------- MAIN ORCHESTRATOR ----------------
export async function findEmail(name, companyName) {
  if (!name || !companyName) return { email: "Unknown", source: "none" };

  try {
    // --- STEP 1: CHECK DEDICATED COMPANY CACHE ---
    const companyDoc = await Company.findOne({ 
      name: { $regex: new RegExp(`^${companyName}$`, "i") } 
    });

    if (companyDoc) {
      const existingContact = companyDoc.contacts.find(
        c => c.hrName.toLowerCase() === name.toLowerCase()
      );

      if (existingContact) {
        console.log(`🎯 Company Cache Hit: ${name} @ ${companyName}`);
        return {
          email: existingContact.hrEmail,
          source: "company_database",
          confidence: 100
        };
      }
    }

    // --- STEP 2: GET DOMAIN & EXTERNAL SEARCH ---
    const domain = await getDomain(companyName);
    const hunterResult = await tryHunter(name, domain);

    const finalResult = hunterResult || fallback(name, domain);

    // --- STEP 3: AUTO-SAVE TO COMPANY MODEL ---
    // If we found a high-confidence email, save it for future users
    if (finalResult.email !== "Unknown") {
      await saveToCompanyCache(companyName, domain, name, finalResult);
    }

    return finalResult;

  } catch (error) {
    console.error("Enrichment Orchestrator Error:", error.message);
    return { email: "Unknown", source: "error" };
  }
}

/**
 * Internal helper to update the centralized Company database
 */
async function saveToCompanyCache(companyName, domain, hrName, result) {
  try {
    await Company.findOneAndUpdate(
      { name: companyName },
      { 
        $set: { domain: domain },
        $addToSet: { 
          contacts: { 
            hrName, 
            hrEmail: result.email, 
            source: result.source 
          } 
        } 
      },
      { 
        upsert: true, 
        returnDocument: 'after' // Replaces the deprecated new: true option
      }
    );
  } catch (err) {
    console.error("Failed to update company cache:", err.message);
  }
}