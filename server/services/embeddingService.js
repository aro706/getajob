import { GoogleGenerativeAI } from "@google/generative-ai";

async function generateEmbedding(text) {
  try {
    // 1. Initialize inside the function so dotenv is guaranteed to be loaded
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2. FIXED: Use the exact same model we successfully used in seedRoles.js!
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    
    // 3. Generate the vector
    const result = await model.embedContent(text);
    
    return result.embedding.values;

  } catch (err) {
    console.error("Embedding Error:", err);
    throw new Error("Embedding failed");
  }
}

export default generateEmbedding;