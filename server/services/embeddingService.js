import axios from "axios";

const API_KEY = process.env.GEMINI_API_KEY;

async function generateEmbedding(text) {
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${API_KEY}`,
      {
        content: {
          parts: [{ text }]
        }
      }
    );

    return res.data.embedding.values;

  } catch (err) {
    console.error("Embedding Error:", err.response?.data || err.message);
    throw new Error("Embedding failed");
  }
}

export default generateEmbedding;