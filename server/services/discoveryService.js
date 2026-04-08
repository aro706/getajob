import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------- UTIL: CHUNK ARRAY ----------------
export function chunk(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

// ---------------- 1. JOB SEARCH (INDIA STRICT) ----------------
export async function getHiringCompanies(role) {
  console.log(`Fetching targeted hiring companies in India for: ${role}...`);
  const SERPAPI_KEY = process.env.SERPAPI_KEY;

  // Added "startup OR company" and strict India keywords
  const query = `"${role}" hiring India (startup OR company) OR "we are hiring" "${role}" India`;
  
  // IMPROVEMENT: Added &gl=in to force SerpAPI to search from the Indian region
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&gl=in&api_key=${SERPAPI_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  const results = (data.organic_results || []).slice(0, 15);
  return await extractCompanies(results);
}

// ---------------- 2. GEMINI COMPANY FILTER ----------------
async function extractCompanies(results) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `
You are an expert tech recruiter based in India.
Extract a list of company names from the search results that are CURRENTLY hiring.

STRICT RULES:
- Must be located and hiring in INDIA. If a company is not in India, EXCLUDE IT.
- Prefer startups, mid-size companies, and product-based companies.
- EXCLUDE massive big tech companies (Google, Amazon, Microsoft, Meta, Apple).
- EXCLUDE training institutes, consultancies, job portals, and staffing agencies.
- Return ONLY a valid JSON array of strings. Do not include markdown formatting like \`\`\`json.
- If no matching companies are found, return [].

Data:
${JSON.stringify(results)}
`;

  const res = await model.generateContent(prompt);
  let text = res.response.text();

  // Clean JSON output safely
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = text.match(/\[.*\]/s);
  if (match) text = match[0];

  return JSON.parse(text || "[]");
}

// ---------------- 3. HR SEARCH ----------------
export async function searchBatch(companies) {
  if (!companies || companies.length === 0) return [];

  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  const companyQuery = companies.map(c => `"${c}"`).join(" OR ");
  
  // LinkedIn X-Ray strictly targeting Indian profiles
  const query = `site:linkedin.com/in (${companyQuery}) ("recruiter" OR "HR" OR "talent acquisition" OR "founder") "India"`;
  
  console.log("HR Query:", query);

  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&gl=in&api_key=${SERPAPI_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return (data.organic_results || []).slice(0, 15).map(r => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet
  }));
}

// ---------------- 4. GEMINI HR FILTER ----------------
export async function extractHR(results) {
  if (!results || results.length === 0) return [];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  // Inside both functions
const model = genAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite-preview"
});
  const prompt = `
Extract HR personnel, recruiters, or founders from the provided search results.

STRICT RULES:
- The person MUST be based in INDIA.
- The person MUST currently hold an HR, Recruiter, Talent Acquisition, or Founder/Co-founder role.
- Extract their full name, exact role, company name, and LinkedIn profile URL.
- Return ONLY a valid JSON array of objects. Do not include markdown formatting.
- If no valid people are found, return [].

Return Format:
[
 {"name":"John Doe", "role":"HR Manager", "company":"TechCorp", "linkedin":"https://linkedin.com/in/johndoe"}
]

Data:
${JSON.stringify(results)}
`;

  const res = await model.generateContent(prompt);
  let text = res.response.text();

  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const match = text.match(/\[.*\]/s);
  if (match) text = match[0];

  return JSON.parse(text || "[]");
}
