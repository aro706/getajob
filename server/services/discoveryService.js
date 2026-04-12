import { GoogleGenerativeAI } from "@google/generative-ai";

export function chunk(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

export async function fetchRawCompanies(role) {
  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  
  // Relaxed the strict negative keywords to get volume back. 
  // We only block the main domains of job portals now, not the raw words.
  // Increased num=50 to fetch maximum organic results in one API call.
  const query = `"${role}" hiring India (startup OR tech) OR "we are hiring" "${role}" India -site:naukri.com -site:indeed.com -site:glassdoor.co.in`;
  
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&gl=in&num=50&api_key=${SERPAPI_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return (data.organic_results || []).slice(0, 50);
}

export async function filterCompaniesWithGemini(results) {
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
- Return ONLY a valid JSON array of strings. Do not include markdown formatting.
- If no matching companies are found, return [].

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

export async function getHiringCompanies(role) {
  const results = await fetchRawCompanies(role);
  return await filterCompaniesWithGemini(results);
}

export async function searchBatch(companies) {
  if (!companies || companies.length === 0) return [];

  const SERPAPI_KEY = process.env.SERPAPI_KEY;
  const companyQuery = companies.map(c => `"${c}"`).join(" OR ");
  const query = `site:linkedin.com/in (${companyQuery}) (intitle:"HR" OR intitle:"Recruiter" OR intitle:"Talent" OR intitle:"People") "India"`;

  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&gl=in&api_key=${SERPAPI_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  return (data.organic_results || []).slice(0, 15).map(r => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet
  }));
}

export async function extractHR(results) {
  if (!results || results.length === 0) return [];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.1-flash-lite-preview"
  });
  
  const prompt = `
You are a strict data parser. Extract ONLY dedicated HR professionals from the search results.

STRICT RULES:
- The person MUST be based in INDIA.
- The person MUST hold a dedicated HR role.
- EXCLUDE Founders, CEOs, Directors, Software Engineers, Developers, and Consultants. 
- Extract their full name, exact HR role, company name, and LinkedIn profile URL.
- Return ONLY a valid JSON array of objects. Do not include markdown formatting.
- If no valid HR people are found, return [].

Return Format:
[
 {"name":"John Doe", "role":"Technical Recruiter", "company":"TechCorp", "linkedin":"https://linkedin.com/in/johndoe"}
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