import axios from "axios";

// ---------------- NEW: DYNAMIC DOMAIN LOOKUP ----------------
async function getDomain(company) {
  try {
    // Search for the real company domain using a free API
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`;
    const res = await axios.get(url);
    
    // If a match is found, return the actual domain (e.g., startup.ai)
    if (res.data && res.data.length > 0) {
      console.log(`Found domain for ${company}: ${res.data[0].domain}`); // <-- Add this
      return res.data[0].domain; 
    }
  } catch (error) {
    console.error(`Clearbit lookup failed for ${company}`);
  }

  // Fallback if API fails
  let cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanName}.com`;
}

function clean(s) {
  return s.replace(/[^a-z]/gi, '').toLowerCase();
}

// ---------------- FALLBACK ----------------
function fallback(name, domain) {
  const parts = name.split(" ").map(clean);
  const first = parts[0] || "";
  const last = parts[1] || "";

  return {
    email: last ? `${first}.${last}@${domain}` : `${first}@${domain}`,
    source: "generated (unverified)"
  };
}

// ---------------- HUNTER ----------------
export async function findEmail(name, company) {
  // Use the new async domain finder
  const domain = await getDomain(company); 
  const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

  if (!HUNTER_API_KEY) {
    return fallback(name, domain);
  }

  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${domain}&full_name=${encodeURIComponent(name)}&api_key=${HUNTER_API_KEY}`;
    const res = await axios.get(url);
    const data = res.data.data;

    if (!data || !data.email || data.score < 70) {
      return fallback(name, domain);
    }

    return {
      email: data.email,
      source: "hunter"
    };

  } catch (error) {
    return fallback(name, domain);
  }
}