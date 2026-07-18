// server/services/roadmapService.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resume from "../models/Resume.js"; // Standard fallback verification

/**
 * Iterates through a specified list of Gemini model versions if a primary model 
 * experiences a timeout, rate-limiting, or general server outage.
 */
async function generateWithFallback(genAI, prompt) {
  const FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite"
  ];

  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[AI FALLBACK TRY] Attempting roadmap generation with model: ${modelName}`);
      
      // Instantiate the individual model using strict native JSON controls
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      
      // Parse to verify it returned valid structured data before exiting loop
      const verifiedJson = JSON.parse(rawText);
      
      console.log(`✅ [AI FALLBACK SUCCESS] Generation completed successfully using: ${modelName}`);
      return verifiedJson;

    } catch (error) {
      lastError = error;
      console.warn(`⚠️ [MODEL BLOCKED/BUSY] ${modelName} failed. Reason: ${error.message || error}`);
      console.log("🔄 Shifting execution to the next available fallback candidate...");
    }
  }

  // Throw a clear error tracking the last problem if everything fails
  throw new Error(`All available generative models in the fallback pool failed. Final trace: ${lastError.message}`);
}

export async function generatePersonalizedRoadmap(userSkills, goal, availableTime) {
  // Initialize the Gemini client using the environment variable configuration
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    console.log(`✨ Triggering personalized AI pipeline for goal: "${goal}"`);

    // GENERATION: Prompt Gemini with the extracted skills context 
    // and format constraints tailored to your frontend UI shell layout components
    // Add these instructions inside the prompt string of generatePersonalizedRoadmap

    const prompt = `
    You are a Senior Career Mentor. Create a highly structured, personalized learning roadmap for an aspirant targeting a "${goal}" role.
    
    USER PROFILE CONTEXT:
    - Current Known Skills: ${userSkills.join(", ")}
    - Time Horizon Available: ${availableTime}

    LOGIC RULES:
    1. GAP ANALYSIS: The user already knows: ${userSkills.join(", ")}. Do not waste time teaching these fundamentals. Focus completely on the missing high-value capabilities needed to bridge the gap and become competent for the "${goal}" role.
    2. TRUST & RATIONALE: For every single module, you MUST provide a clear, personalized "rationale" explaining exactly why this skill is vital for a "${goal}" role, directly referencing how it complements or elevates their current skills.
    3. HANDS-ON PROOF: Include a small, concrete micro-project or implementation challenge for each step so the user can prove competency.
    4. RESPONSE SCHEMA: Return ONLY a valid JSON object matching this structure with no markdown backticks or extra text wrapping:
    {
      "steps": [
        { 
          "title": "Module or Topic Name", 
          "duration": "Timeframe allocation (e.g., Days 1-5)", 
          "rationale": "Personalized explanation connecting their current skills to this new target gap.",
          "description": "Deep dive explanation of the targeted architectural concepts or tools.", 
          "handsOnProject": "A concrete mini-project goal to build (e.g., Build a rate-limiting middleware using Redis token buckets).",
          "milestones": [
            "Actionable study target or specific building objective 1",
            "Actionable study target or specific building objective 2"
          ],
          "trustedResources": ["Official Documentation Link", "Vetted community guide or repo framework"]
        }
      ]
    }
    `;
    // Hand execution flow over to our robust fallback runner engine
    const finalResponse = await generateWithFallback(genAI, prompt);
    return finalResponse;

  } catch (error) {
    console.error("Roadmap Service Core Error:", error);
    throw new Error("Generative pipeline execution failure: " + error.message);
  }
}