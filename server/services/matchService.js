import qdrantClient from '../config/qdrant.js';

export async function findTopMatchingRoles(resumeEmbedding, topK = 3) {
  try {
    // Query Qdrant's 'roles' collection
    const searchResults = await qdrantClient.search("roles", {
      vector: Array.from(resumeEmbedding),
      limit: topK,
      with_payload: true // Brings back the title and description
    });

    if (!searchResults || searchResults.length === 0) {
      throw new Error("No matches found in Qdrant. Did you run seedRoles.js?");
    }

    const matchedRoles = searchResults.map((match) => {
      return {
        id: match.payload.mongoId, // Extract original Mongo ID
        title: match.payload.title,
        description: match.payload.description,
        // Qdrant returns score as a float, like 0.854
        matchPercentage: (match.score * 100).toFixed(2) + "%"
      };
    });

    return matchedRoles;

  } catch (error) {
    console.error("Match Service Error (Qdrant):", error);
    throw error;
  }
}