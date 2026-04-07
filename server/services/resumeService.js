import pdf from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import embeddingService from "./embeddingService.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  throw new Error("Unsupported file format");
}

// ---------- PARSE USING GEMINI ----------
async function parseResume(text) {
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

  // Clean JSON
  output = output.replace(/```json/g, "").replace(/```/g, "").trim();

  const match = output.match(/\{[\s\S]*\}/);
  if (match) output = match[0];

  return JSON.parse(output);
}

// ---------- MAIN ----------
async function processResume(file) {
  const text = await extractText(file);

  const parsed = await parseResume(text);

  const embedding = await embeddingService.generateEmbedding(
    JSON.stringify(parsed)
  );

  // You can store this in DB later
  return {
    parsed,
    embedding
  };
}

export default processResume;