import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function generateEmbedding(text) {
  try {
    if (!text || text.trim() === "") {
      throw new Error("Empty text for embedding");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-embedding-2-preview", // ✅ FIXED MODEL NAME
    });

    const result = await model.embedContent({
      content: {
        parts: [{ text }],
      },
    });

    const embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw new Error("Embedding generation returned empty values");
    }

    return embedding;
  } catch (err) {
    console.error("❌ Embedding Error:", err.message);
    throw new Error("Failed to generate vector");
  }
}

export default generateEmbedding;