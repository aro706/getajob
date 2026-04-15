import pdf from "pdf-parse/lib/pdf-parse.js"; 
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import generateEmbedding from "./embeddingService.js"; 
import Resume from "../models/Resume.js";

async function extractText(file) {
  if (file.mimetype === "application/pdf") {
    const data = await pdf(file.buffer);
    return data.text;
  }
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
  throw new Error("Unsupported file format. Please upload a PDF or DOCX.");
}

async function parseResume(text) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Using the stable flash model to prevent 503 demand spikes
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `Extract structured data from resume. Return ONLY JSON: {"skills": [], "experience": [{"company": "", "role": "", "duration": "", "description": ""}]} \n\nResume:\n${text}`;

  const result = await model.generateContent(prompt);
  let output = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const match = output.match(/\{[\s\S]*\}/);
  if (match) output = match[0];

  return JSON.parse(output);
}

async function processResume(file) {
  const text = await extractText(file);
  const parsed = await parseResume(text);
  
  // Generate the 3072-dimension vector from Gemini
  const embedding = Array.from(await generateEmbedding(JSON.stringify(parsed)));

  const newResume = new Resume({
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    embedding: embedding,
  });

  // 🚀 Just save to MongoDB! Atlas Vector Search handles the indexing automatically.
  const savedResume = await newResume.save();

  return savedResume;
}

export default processResume;