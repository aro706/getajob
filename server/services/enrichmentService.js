import axios from "axios";

// ---------------- DOMAIN LOOKUP (BEST VERSION) ----------------
async function getDomain(company) {
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`;
    const res = await axios.get(url);

    if (res.data && res.data.length > 0) {
      console.log(`Found domain for ${company}: ${res.data[0].domain}`);
      return res.data[0].domain;
    }
  } catch (error) {
    console.error(`Clearbit lookup failed for ${company}`);
  }

  // Fallback
  const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${cleanName}.com`;
}

// ---------------- UTIL ----------------
function clean(s) {
  if (!s) return "";
  return s.replace(/[^a-z]/gi, "").toLowerCase();
}

// ---------------- FALLBACK GENERATOR ----------------
function fallback(name, domain) {
  const parts = name.split(" ").map(clean);
  const first = parts[0] || "";
  const last = parts[1] || "";

  return {
    email: last
      ? `${first}.${last}@${domain}`
      : `${first}@${domain}`,
    source: "generated (unverified)"
  };
}

// ---------------- HUNTER (PRIMARY ENGINE) ----------------
async function tryHunter(name, domain) {
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
  if (!HUNTER_API_KEY) return null;

  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&full_name=${encodeURIComponent(name)}&api_key=${HUNTER_API_KEY}`;

    const res = await axios.get(url, { timeout: 4000 });
    const data = res.data.data;

    if (data && data.email && data.score >= 70) {
      return {
        email: data.email,
        source: "hunter",
        confidence: data.score
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

// ---------------- MAIN ORCHESTRATOR ----------------
export async function findEmail(name, company) {
  if (!name || !company) {
    return { email: "Unknown", source: "none" };
  }

  // STEP 1: Get domain (async)
  const domain = await getDomain(company);

  // STEP 2: Try Hunter
  const hunterResult = await tryHunter(name, domain);
  if (hunterResult) return hunterResult;

  // STEP 3: Fallback generator
  return fallback(name, domain);
}