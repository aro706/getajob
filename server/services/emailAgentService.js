// import { GoogleGenerativeAI } from "@google/generative-ai";

// export async function generateEmailDrafts(resumeData, companyName, roleTitle, hrName) {
//   // Ensure the API key is available
//   if (!process.env.GEMINI_API_KEY) {
//       throw new Error("GEMINI_API_KEY is missing in .env file");
//   }

//   const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//   const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

//   const prompt = `
//       You are an expert technical recruiter and career coach.
//       Draft 3 different variations of a high-conversion cold email to an HR manager.
      
//       Context:
//       - Recruiter Name: ${hrName || 'Hiring Manager'}
//       - Target Company: ${companyName}
//       - Job Role: ${roleTitle}
//       - Candidate Skills: ${resumeData.skills.join(", ")}
//       - Candidate Recent Experience: ${JSON.stringify(resumeData.experience[0] || 'Relevant academic projects')}
      
//       Instructions:
//       Return ONLY a valid JSON object with EXACTLY three keys: "professional", "bold", and "concise".
//       Do not include any markdown formatting like \`\`\`json.
      
//       - "professional": Direct, polite, explains how their skills match the role.
//       - "bold": Confident, highly focused on value add, uses an unconventional hook.
//       - "concise": Maximum 3 to 4 sentences, straight to the point with a clear Call to Action.
//   `;

//   try {
//       const result = await model.generateContent(prompt);
//       const text = result.response.text();
      
//       // Clean up potential markdown formatting from the LLM
//       const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
//       return JSON.parse(jsonStr);
//   } catch (error) {
//       console.error("Error generating email drafts:", error);
//       throw new Error("Failed to generate drafts via Gemini");
//   }
// }

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
    model: "gemini-1.5-flash",
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