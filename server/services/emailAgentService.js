import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🛡️ The Bulletproof Retry Wrapper (From the API fix branch)
async function generateWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        console.log(`\n⏳ [Rate Limit Hit] Google needs a minute to reset the quota. Pausing for 62 seconds... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 62000));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to generate content after maximum retries.");
}

/**
 * Generates 3 variations of cold emails using Gemini AI.
 * Merges JSON mode for consistent parsing WITH rate-limit protection.
 */
export const generateEmailDrafts = async (resume, companyName, roleTitle, hrName) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing!");
  }

  // 🚀 Using the modern, high-capacity model WITH JSON formatting forced
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  // Safely extract resume details for the prompt
  const candidateSkills = resume.skills ? resume.skills.join(", ") : "Not specified";
  const candidateExperience = resume.experience && resume.experience.length > 0 
    ? resume.experience.map(e => `${e.role || 'Professional'} at ${e.company || 'Company'}`).join(", ") 
    : "Not specified";

  // The 3-variation prompt (From your HEAD branch)
  const prompt = `
      You are an expert technical recruiter and career coach. Draft 3 high-conversion cold email variations.
      
      Candidate Data:
      - Skills: ${candidateSkills}
      - Experience: ${candidateExperience}
      
      Outreach Context:
      - Recruiter: ${hrName || 'Hiring Manager'}
      - Company: ${companyName}
      - Target Role: ${roleTitle}
      
      Output Requirements (Strict JSON):
      {
        "professional": "Direct, formal, uses the candidate's specific experience to match the role.",
        "bold": "Confident, value-driven, highlights a specific project/skill.",
        "concise": "Max 4 sentences, punchy, mentioning a relevant skill."
      }

      Include subject lines inside each string.
  `;

  try {
    // 🛡️ Passing the JSON prompt through the retry wrapper!
    const result = await generateWithRetry(model, prompt);
    let text = result.response.text();

    try {
      return JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned || "{}");
    }
      
  } catch (error) {
    console.error("Error generating email drafts:", error);
    throw new Error("Failed to generate drafts via Gemini");
  }
}