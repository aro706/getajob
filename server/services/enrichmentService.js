import axios from "axios";

// ---------------- UTIL & FALLBACK ----------------
function getDomain(company) {
  if (!company) return "";
  return company.toLowerCase().replace(/\s+/g, '') + ".com";
}

function clean(s) {
  if (!s) return "";
  return s.replace(/[^a-z]/gi, '').toLowerCase();
}

function fallback(name, domain) {
  const parts = name.split(" ").map(clean);
  const first = parts[0] || "";
  const last = parts[1] || "";
  return {
    email: last ? `${first}.${last}@${domain}` : `${first}@${domain}`,
    source: "generated"
  };
}

// ---------------- 1. HUNTER (Primary Engine) ----------------
async function tryHunter(name, company) {
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  const domain = getDomain(company);
  if (!HUNTER_API_KEY) return null;

  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&full_name=${encodeURIComponent(name)}&api_key=${HUNTER_API_KEY}`;
    // 4-second timeout so your pipeline never hangs
    const res = await axios.get(url, { timeout: 4000 }); 
    const data = res.data.data;

    // Hunter scores confidence out of 100. We only accept 70+
    if (data && data.email && data.score >= 70) {
      return { email: data.email, source: "hunter" };
    }
    return null;
  } catch (error) {
    return null; // Silent fail, move to generator
  }
}

// ---------------- WATERFALL ORCHESTRATOR ----------------
export async function findEmail(name, company) {
  if (!name || !company) return { email: "Unknown", source: "none" };

  // STEP 1: Hunter
  const hunterResult = await tryHunter(name, company);
  if (hunterResult) return hunterResult;

  // STEP 2: Generator (Fallback)
  const domain = getDomain(company);
  return fallback(name, domain);
}