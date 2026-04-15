import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function generateEmbedding(text, type) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  
  const taskType = type === "document" ? TaskType.RETRIEVAL_DOCUMENT : TaskType.RETRIEVAL_QUERY;

  const result = await model.embedContent({
    // 🚀 THE FIX: Wrapped the string in the required 'parts' array format
    content: { parts: [{ text: text }] }, 
    taskType: taskType
  });
  
  return result.embedding.values;
}