import pdf from "pdf-parse/lib/pdf-parse.js"; 
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resume from "../models/Resume.js";
import generateEmbedding from "./embeddingService.js";

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

// 🛡️ The Bulletproof Retry Wrapper
async function generateWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        console.log(`\n⏳ [Rate Limit Hit - Parser] Quota exceeded. Pausing for 62 seconds... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 62000));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to parse resume after maximum retries.");
}

async function parseResume(text) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Extract structured data from resume. Return ONLY JSON: {"skills": [], "experience": [{"company": "", "role": "", "duration": "", "description": ""}]} \n\nResume:\n${text}`;

  // Use the retry wrapper here!
  const result = await generateWithRetry(model, prompt);
  
  let output = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
  const match = output.match(/\{[\s\S]*\}/);
  if (match) output = match[0];

  return JSON.parse(output);
}

async function processResume(file) {
  const text = await extractText(file);
  const parsed = await parseResume(text);
  
  const skillString = (parsed.skills || []).join(", ");
  const expString = (parsed.experience || [])
    .map(exp => `${exp.role || 'Professional'} at ${exp.company || 'Company'}`)
    .join(". ");
  
  const textToEmbed = `Software and Tech Professional. Skills include: ${skillString}. Experience includes: ${expString}.`;
  
  // ✅ FIXED: Renamed to mainEmbedding to stop the ReferenceError crash
  const mainEmbedding = Array.from(await generateEmbedding(textToEmbed, "query"));

  const newResume = new Resume({
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    embedding: mainEmbedding,
  });

  const savedResume = await newResume.save();

  console.log("✅ Resume processed and saved to MongoDB successfully!");

  return savedResume;
}

export default processResume;