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
          limit: limit
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
    ]);

    // ✅ Debug logging
    console.log("\n🔍 RAW MONGODB SCORES:");
    matchedRoles.forEach((match, i) => {
      console.log(`${i + 1}. ${match.title}: ${match.score}`);
    });

    if (!matchedRoles || matchedRoles.length === 0) {
      console.log("⚠️ No roles found.");
      return [];
    }

    // ✅ Apply threshold AFTER logging
    const filteredRoles = matchedRoles.filter(match => match.score >= 0.55);

    if (filteredRoles.length === 0) {
      console.log("⚠️ No roles met threshold. Returning top matches anyway for debugging.");
      return matchedRoles.map((match) => ({
        id: match._id.toString(),
        title: match.title,
        description: match.description,
        matchPercentage: (match.score * 100).toFixed(2) + "%"
      }));
    }

    return filteredRoles.map((match) => ({
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