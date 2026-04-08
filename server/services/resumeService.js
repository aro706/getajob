import pdf from "pdf-parse/lib/pdf-parse.js"; // FIXED: The bypass trick!
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import generateEmbedding from "./embeddingService.js"; // FIXED import
import Resume from "../models/Resume.js";
import Role from "../models/Role.js"; // NEW: For updating ranklists
import { cosineSimilarity } from "../utils/similarity.js"; // NEW: For scoring against roles

// ---------- EXTRACT TEXT ----------
async function extractText(file) {
  if (file.mimetype === "application/pdf") {
    // pdf-extraction works perfectly as a normal function
    const data = await pdf(file.buffer);
    return data.text;
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  throw new Error("Unsupported file format. Please upload a PDF or DOCX.");
}

// ---------- PARSE USING GEMINI ----------
async function parseResume(text) {
  // FIXED: Initialize genAI inside the function!
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
  });

  const prompt = `
Extract structured data from resume.

Return ONLY JSON:
{
  "skills": [],
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "description": ""
    }
  ]
}

Resume:
${text}
`;

  const result = await model.generateContent(prompt);
  let output = result.response.text();

  output = output
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const match = output.match(/\{[\s\S]*\}/);
  if (match) output = match[0];

  return JSON.parse(output);
}

// ---------- MAIN ----------
async function processResume(file) {
  // 1. Extract text
  const text = await extractText(file);

  // 2. Parse into JSON
  const parsed = await parseResume(text);

  // 3. Generate Embedding Vector (Fixed function call)
  const embedding = await generateEmbedding(JSON.stringify(parsed));

  // 4. SAVE TO MONGODB
  const newResume = new Resume({
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    embedding: embedding,
  });

  const savedResume = await newResume.save();

  // 5. UPDATE STANDARD ROLES RANKLISTS
  // Fetch all standard roles we have in the DB
  const standardRoles = await Role.find({});

  for (const role of standardRoles) {
    // Score this new resume against each standard role
    const score = cosineSimilarity(embedding, role.embedding);

    // Push the new resume to this role's ranklist
    role.rankedResumes.push({
      resumeId: savedResume._id,
      score: score,
    });

    // Sort the ranklist so the highest scores are always at the top
    role.rankedResumes.sort((a, b) => b.score - a.score);

    await role.save();
  }

  return savedResume;
}

export default { processResume };
