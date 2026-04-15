import Role from '../models/Role.js';
import generateEmbedding from './embeddingService.js';


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

    // ✅ Debug logging (keep this)
    console.log("\n🔍 RAW MONGODB SCORES:");
    matchedRoles.forEach((match, i) => {
      console.log(`${i + 1}. ${match.title}: ${match.score}`);
    });

    if (!matchedRoles || matchedRoles.length === 0) {
      console.log("⚠️ No roles found.");
      return [];
    }

    // ✅ Apply threshold AFTER logging (best of both worlds)
    const filteredRoles = matchedRoles.filter(match => match.score >= 0.55);

    if (filteredRoles.length === 0) {
      console.log("⚠️ No roles met threshold. Returning top matches anyway for debugging.");
      // fallback → return top results without filtering
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

export async function getRelevantResumeContext(roleTitle, resumeId) {
  try {
    // ✅ IMPORTANT: use query mode for retrieval
    const queryVector = await generateEmbedding(roleTitle, "query");

    const searchResults = await qdrantClient.search("resume_chunks", {
      vector: queryVector,
      filter: {
        must: [{ key: "resumeId", match: { value: resumeId.toString() } }]
      },
      limit: 3,
      with_payload: true
    });

    return searchResults.map(res => res.payload.text).join("\n\n");

  } catch (error) {
    console.error("RAG Retrieval Error:", error);
    return "";
  }
}