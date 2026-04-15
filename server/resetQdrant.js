import qdrantClient from './config/qdrant.js';

async function reset() {
  try {
    console.log("🗑️ Deleting 'resume_chunks'...");
    await qdrantClient.deleteCollection("resume_chunks");
    console.log("✅ Deleted successfully. Now restart your server.");
  } catch (err) {
    console.error("Error:", err.message);
  }
}
reset();