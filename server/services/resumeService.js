import pdf from "pdf-parse/lib/pdf-parse.js"; 
import mammoth from "mammoth";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import generateEmbedding from "./embeddingService.js"; 
import Resume from "../models/Resume.js";
import qdrantClient from "../config/qdrant.js";

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
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

  const prompt = `Extract structured data from resume. Return ONLY JSON: {"skills": [], "experience": [{"company": "", "role": "", "duration": "", "description": ""}]} \n\nResume:\n${text}`;

  const result = await model.generateContent(prompt);
  let output = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const match = output.match(/\{[\s\S]*\}/);
  if (match) output = match[0];

  return JSON.parse(output);
}

// Ensure the Resumes collection exists in Qdrant
async function ensureResumesCollection() {
  try {
    const response = await qdrantClient.getCollections();
    const exists = response.collections.some(c => c.name === "resumes");
    if (!exists) {
      await qdrantClient.createCollection("resumes", { vectors: { size: 3072, distance: "Cosine" } });
    }
  } catch (err) {
    console.error("Collection check error:", err);
  }
}

async function processResume(file) {
  const text = await extractText(file);
  const parsed = await parseResume(text);
  const embedding = Array.from(await generateEmbedding(JSON.stringify(parsed)));

  const newResume = new Resume({
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    embedding: embedding,
  });

  const savedResume = await newResume.save();

  await ensureResumesCollection();

  // UPSERT TO QDRANT
  await qdrantClient.upsert("resumes", {
    wait: true,
    points: [
      {
        id: crypto.randomUUID(),
        vector: embedding,
        payload: {
          mongoId: String(savedResume._id),
          skills: (parsed.skills || []).join(", ")
        }
      }
    ]
  });

  return savedResume;
}

export default processResume;