import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

export default async function generateEmbedding(text, type) {
  // 🚀 THE FIX: We moved this INSIDE the function so it waits for dotenv to load!
  if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables!");
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  const taskType = type === "document" ? TaskType.RETRIEVAL_DOCUMENT : TaskType.RETRIEVAL_QUERY;

  const result = await model.embedContent({
    content: { parts: [{ text: text }] }, 
    taskType: taskType
  });
  
  return result.embedding.values;
}