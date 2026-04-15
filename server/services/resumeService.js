import pdf from "pdf-parse/lib/pdf-parse.js"; 
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resume from "../models/Resume.js";

import qdrantClient from "../config/qdrant.js";
import { v4 as uuidv4 } from "uuid";
import generateEmbedding, { chunkText } from "./embeddingService.js";

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

  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview" 
  });

  const prompt = `Extract structured data from resume. Return ONLY JSON: {"skills": [], "experience": [{"company": "", "role": "", "duration": "", "description": ""}]} \n\nResume:\n${text}`;

  const result = await model.generateContent(prompt);
  let output = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const match = output.match(/\{[\s\S]*\}/);
  if (match) output = match[0];

  return JSON.parse(output);
}

// Ensure the Qdrant collection exists
async function ensureRAGCollection() {
  try {
    const response = await qdrantClient.getCollections();
    const collectionName = "resume_chunks";
    const exists = response.collections.some(c => c.name === collectionName);
    
    if (!exists) {
      console.log(`🚀 Creating collection: ${collectionName}`);
      await qdrantClient.createCollection(collectionName, { 
        vectors: { 
          size: 3072,  // ✅ MUST match embedding model
          distance: "Cosine" 
        } 
      });
    }
  } catch (err) {
    console.error("Collection check error:", err);
  }
}

// RAG chunk storage
export const processResumeRAG = async (resumeId, fullText) => {
  const chunks = chunkText(fullText);
  console.log(`📦 Found ${chunks.length} chunks. Starting Qdrant storage...`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vector = await generateEmbedding(chunk, "document"); // ✅ correct mode
    
    await qdrantClient.upsert("resume_chunks", {
      wait: true,
      points: [{
        id: uuidv4(),
        vector: vector,
        payload: {
          resumeId: resumeId.toString(),
          text: chunk 
        }
      }]
    });

    console.log(`✅ Chunk ${i + 1}/${chunks.length} stored in Qdrant.`);
    console.log(`   └─ ID: ${resumeId} | Vector Size: ${vector.length}`);
  }

  console.log("🚀 ALL embeddings stored in Qdrant collection 'resume_chunks'.");
};

async function processResume(file) {
  const text = await extractText(file);
  const parsed = await parseResume(text);
  
  // ✅ Convert structured data → semantic natural language
  const skillString = (parsed.skills || []).join(", ");
  const expString = (parsed.experience || [])
    .map(exp => `${exp.role || 'Professional'} at ${exp.company || 'Company'}`)
    .join(". ");
  
  const textToEmbed = `Software and Tech Professional. Skills include: ${skillString}. Experience includes: ${expString}.`;
  
  // ✅ FIXED: use "document" mode for stored embeddings
  const mainEmbedding = Array.from(await generateEmbedding(textToEmbed, "document"));

  const newResume = new Resume({
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    embedding: mainEmbedding,
  });

  const savedResume = await newResume.save();

  // RAG pipeline
  await ensureRAGCollection();
  await processResumeRAG(savedResume._id, text);

  console.log("✅ Resume processed with RAG successfully!");

  return savedResume;
}

export default processResume;