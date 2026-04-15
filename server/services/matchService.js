import Role from '../models/Role.js';

export async function findTopMatchingRoles(resumeEmbedding, limit = 10) {
  try {
    const matchedRoles = await Role.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "embedding",
          queryVector: Array.from(resumeEmbedding),
          numCandidates: 100, 
          limit: limit // This will now accept 10
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
      // 🛑 The threshold filter has been completely removed for debugging
    ]);

    console.log("\n🔍 TOP 10 RAW MONGODB SCORES:");
    matchedRoles.forEach((match, i) => {
      console.log(`${i + 1}. ${match.title}: ${match.score}`);
    });

    if (!matchedRoles || matchedRoles.length === 0) {
      console.log("⚠️ No roles found.");
      return [];
    }

    return matchedRoles.map((match) => ({
      id: match._id.toString(),
      title: match.title,
      description: match.description,
      matchPercentage: (match.score * 100).toFixed(2) + "%"
    }));

  } catch (error) {
    console.error("Match Service Error (MongoDB Vector):", error);
    throw error;
  }
}