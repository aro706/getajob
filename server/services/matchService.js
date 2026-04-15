import Role from '../models/Role.js';

export async function findTopMatchingRoles(resumeEmbedding, limit = 5) {
  try {
    const matchedRoles = await Role.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // The name of the index you created in the Atlas UI
          path: "embedding",
          queryVector: Array.from(resumeEmbedding),
          numCandidates: 100, // How many documents to check
          limit: limit
        }
      },
      {
        // Calculate the percentage score (MongoDB returns score directly in the pipeline)
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          score: { $meta: "vectorSearchScore" }
        }
      },
      {
        // Optional: Filter out bad matches (equivalent to score_threshold)
        $match: {
          score: { $gte: 0.55 } 
        }
      }
    ]);

    if (!matchedRoles || matchedRoles.length === 0) {
      console.log("⚠️ No roles met the minimum matching threshold.");
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