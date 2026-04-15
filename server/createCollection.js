import qdrantClient from './config/qdrant.js';

async function initDatabase() {
  try {
    // 1. Check if the "resume_chunks" collection already exists
    const result = await qdrantClient.getCollections();
    const exists = result.collections.some(c => c.name === "resume_chunks");

    if (exists) {
      console.log("✅ Collection 'resume_chunks' already exists!");
      return;
    }

    // 2. Create it with the correct settings for Gemini (768 dimensions)
    await qdrantClient.createCollection("resume_chunks", {
      vectors: {
        size: 768, 
        distance: "Cosine" // Best for comparing text similarity
      }
    });

    console.log("🚀 Success! 'resume_chunks' collection created in Qdrant.");
  } catch (error) {
    console.error("❌ Error creating collection:", error);
  }
}

initDatabase();