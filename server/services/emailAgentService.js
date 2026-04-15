import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generates 3 variations of cold emails using Gemini AI.
 * Uses JSON mode for consistent parsing.
 */
export async function generateEmailDrafts(resumeData, companyName, roleTitle, hrName) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in .env file");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Use a stable flash model for speed and reliability
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview",
    generationConfig: { responseMimeType: "application/json" } // Ensures raw JSON output
  });

  const prompt = `
      You are an expert technical recruiter. Draft 3 high-conversion cold email variations.
      
      Candidate Data:
      - Name: Sachin Kumar
      - Skills: ${resumeData.skills.join(", ")}
      - Top Experience: ${JSON.stringify(resumeData.experience[0] || 'Focus on MERN Stack and VLSI')}
      
      Outreach Context:
      - Recruiter: ${hrName || 'Hiring Manager'}
      - Company: ${companyName}
      - Target Role: ${roleTitle}
      
      Output Requirements (Strict JSON):
      {
        "professional": "Direct, formal, highlights skill-role alignment.",
        "bold": "Confident, value-driven, uses a hook about solving company problems.",
        "concise": "Max 4 sentences, punchy, clear Call to Action."
      }

      Include subject lines inside each string like "Subject: [Title] | [Name] ... [Email Body]".
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // No regex needed anymore because of responseMimeType: "application/json"
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating email drafts:", error);
    throw new Error("Failed to generate drafts via Gemini");
  }
}