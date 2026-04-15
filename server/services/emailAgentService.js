import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generates 3 variations of cold emails using Gemini AI.
 * Uses JSON mode for consistent parsing.
 */
export async function generateEmailDrafts(retrievedContext, companyName, roleTitle, hrName) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in .env file");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
      You are an expert technical recruiter. Draft 3 high-conversion cold email variations.
      
      Candidate Data (Retrieved from Resume):
      ${retrievedContext}
      
      Outreach Context:
      - Recruiter: ${hrName || 'Hiring Manager'}
      - Company: ${companyName}
      - Target Role: ${roleTitle}
      
      Output Requirements (Strict JSON):
      {
        "professional": "Direct, formal, uses the candidate's specific experience to match the role.",
        "bold": "Confident, value-driven, highlights a specific project from the data above.",
        "concise": "Max 4 sentences, punchy, mentioning a relevant skill."
      }

      Include subject lines inside each string.
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    try {
      return JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned || "{}");
    }
      
  } catch (error) {
    console.error("Error generating RAG email drafts:", error);
    throw new Error("Failed to generate drafts via Gemini");
  }
}