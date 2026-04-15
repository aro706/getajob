import { GoogleGenerativeAI } from "@google/generative-ai";
import LearningResource from "../models/LearningResource.js";
import generateEmbedding from "./embeddingService.js";
import RoadmapCache from "../models/RoadmapCache.js";

export async function generatePersonalizedRoadmap(userSkills, goal, availableTime) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview",
    generationConfig: { responseMimeType: "application/json" }
  });

  try {
    // 1. Create a Unique Request Key and Vector for Caching
    // We include skills and time so the cache is truly personalized
    const requestKey = `Goal: ${goal} | Time: ${availableTime} | Skills: ${userSkills.sort().join(",")}`;
    const queryVector = await generateEmbedding(requestKey);

    // 2. SEMANTIC CACHE CHECK: Look for a previous similar response
    const cachedResult = await RoadmapCache.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index", // Using your one remaining index slot
          "path": "queryVector",
          "queryVector": queryVector,
          "numCandidates": 10,
          "limit": 1
        }
      },
      {
        "$project": { 
          "response": 1, 
          "score": { "$meta": "vectorSearchScore" } 
        }
      }
    ]);

    // If we find a 95%+ match, return the cached roadmap immediately
    if (cachedResult.length > 0 && cachedResult[0].score > 0.95) {
      console.log("🚀 Cache Hit! Returning stored roadmap.");
      return cachedResult[0].response;
    }

    // 3. RETRIEVAL: If cache miss, find learning resources from DB
    // Optimization: Reuse the embedding logic for the goal specifically
    const goalVector = await generateEmbedding(goal);
    const searchResults = await LearningResource.aggregate([
      {
        "$vectorSearch": {
          "index": "vector_index",
          "path": "embedding",
          "queryVector": goalVector,
          "numCandidates": 100,
          "limit": 5
        }
      }
    ]);

    let learningContext = searchResults.length > 0 
      ? `Use these verified resources:\n${searchResults.map(r => r.content).join("\n")}`
      : `No specific local resources found for "${goal}". Use industry standards.`;

    // 4. GENERATION: Prompt Gemini
    const prompt = `
      You are a Senior Career Mentor. Create a personalized learning roadmap for a ${goal} role.
      USER CONTEXT:
      - Current Skills: ${userSkills.join(", ")}
      - Time Available: ${availableTime}
      KNOWLEDGE BASE: ${learningContext}

      LOGIC:
      1. GAP ANALYSIS: Skip ${userSkills.join(", ")}.
      2. TIME SCALING: Fit exactly within ${availableTime}.
      3. OUTPUT: Return ONLY a JSON object:
      {
        "overview": "Strategy for ${goal} within ${availableTime}",
        "schedule": [
          { "period": "Week 1", "topic": "", "tasks": [], "resources": [] }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const finalResponse = JSON.parse(result.response.text());

    // 5. STORE IN CACHE: Save for future similar requests
    await RoadmapCache.create({
      queryVector: queryVector,
      requestKey: requestKey,
      response: finalResponse
    });

    return finalResponse;

  } catch (error) {
    console.error("Roadmap Service Error:", error);
    throw new Error("Failed to generate your personalized roadmap.");
  }
}