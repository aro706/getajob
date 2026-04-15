import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Helper to split text into meaningful chunks for RAG
export function chunkText(text, maxLength = 500) {
  const sentences = text.split(/[.!?]+\s/);
  let chunks = [];
  let currentChunk = "";

  for (let sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence + ". ";
    } else {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + ". ";
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// ✅ Main embedding function
export default async function generateEmbedding(text, type = "document") {
  try {
    if (!text || text.trim() === "") {
      throw new Error("Empty text for embedding");
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-embedding-001" 
    });

    const taskType = type === "document" 
      ? TaskType.RETRIEVAL_DOCUMENT 
      : TaskType.RETRIEVAL_QUERY;

    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType
    });

    return result.embedding.values;

  } catch (err) {
    console.error("Embedding Error:", err);
    throw err;
  }
}