import pdf from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import generateEmbedding from "./embeddingService.js";
import Resume from "../models/Resume.js"; // IMPORTING THE NEW MODEL!

// ---------- EXTRACT TEXT ----------
async function extractText(file) {
  if (file.mimetype === "application/pdf") {
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
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
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

  output = output.replace(/```json/g, "").replace(/```/g, "").trim();

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

  // 3. Generate Embedding Vector
  const embedding = await generateEmbedding(JSON.stringify(parsed));

  // 4. SAVE TO MONGODB
  const newResume = new Resume({
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    embedding: embedding
  });

  const savedResume = await newResume.save();

  // Return the database document (which now has an _id!)
  return savedResume; 
}

export default processResume;