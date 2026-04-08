import axios from "axios";

// ---------------- UTIL ----------------
function getDomain(company) {
  // Removes spaces, dots, and common suffixes to guess the domain
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
    source: "generated"
  };
}

// ---------------- HUNTER ----------------
export async function findEmail(name, company) {
  const domain = getDomain(company);
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