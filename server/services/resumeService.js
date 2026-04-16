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

// 🛡️ The Waterfall Fallback Wrapper
async function generateWithFallback(genAI, prompt) {
  const FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite"
  ];

  // We will run through the list of models twice just in case
  for (let cycle = 1; cycle <= 2; cycle++) {
    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result; // Success! Return the data.
      } catch (error) {
        const isBusy = error.status === 429 || error.status === 503 || 
                       (error.message && (error.message.includes("429") || error.message.includes("503")));
        
        if (isBusy) {
          console.log(`⚠️ [${modelName}] is busy/rate-limited. Instantly switching to next model...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Tiny 0.5s breather
          continue; // Move to the next model in the array
        } else {
          throw error; // If it's a completely different error, crash normally
        }
      }
    }
    console.log(`\n⏳ All models are currently overloaded. Taking a 30s breather before Cycle ${cycle + 1}...`);
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  throw new Error("Failed to parse resume: All fallback models exhausted.");
}

async function parseResume(text) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const prompt = `Extract structured data from resume. Return ONLY JSON: {"skills": [], "experience": [{"company": "", "role": "", "duration": "", "description": ""}]} \n\nResume:\n${text}`;

  // Use the new fallback wrapper!
  const result = await generateWithFallback(genAI, prompt);
  
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