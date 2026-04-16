import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🛡️ The Waterfall Fallback Wrapper (with JSON Support)
async function generateWithFallback(prompt) {
  const FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite"
  ];

  for (let cycle = 1; cycle <= 2; cycle++) {
    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" } // Force JSON
        });
        
        return await model.generateContent(prompt);
      } catch (error) {
        const isBusy = error.status === 429 || error.status === 503 || 
                       (error.message && (error.message.includes("429") || error.message.includes("503")));
        
        if (isBusy) {
          console.log(`⚠️ Email Agent: [${modelName}] busy. Switching models...`);
          await new Promise(resolve => setTimeout(resolve, 500)); 
          continue;
        } else {
          throw error;
        }
      }
    }
    console.log(`\n⏳ Email Agent: All models overloaded. Pausing 30s before Cycle ${cycle + 1}...`);
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  throw new Error("Failed to generate email drafts: All fallback models exhausted.");
}

export const generateEmailDrafts = async (resume, companyName, roleTitle, hrName) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing!");
  }

  const candidateSkills = resume.skills ? resume.skills.join(", ") : "Not specified";
  const candidateExperience = resume.experience && resume.experience.length > 0 
    ? resume.experience.map(e => `${e.role || 'Professional'} at ${e.company || 'Company'}`).join(", ") 
    : "Not specified";

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
    // 🛡️ Passing the prompt through the new waterfall wrapper!
    const result = await generateWithFallback(prompt);
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