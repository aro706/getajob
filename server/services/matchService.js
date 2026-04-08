import Role from '../models/Role.js';
import { cosineSimilarity } from '../utils/similarity.js';

export async function findTopMatchingRoles(resumeEmbedding, topK = 2) {
  try {
    // 1. Fetch all roles from the database
    const allRoles = await Role.find({});

    if (!allRoles || allRoles.length === 0) {
      throw new Error("No roles found in the database. Did you run seedRoles.js?");
    }

    // 2. Compare the resume vector against every role vector
    const matchedRoles = allRoles.map((role) => {
      const score = cosineSimilarity(resumeEmbedding, role.embedding);
      
      return {
        id: role._id,
        title: role.title,
        description: role.description,
        // Convert the decimal score to a percentage for easier reading!
        matchPercentage: (score * 100).toFixed(2) + "%" 
      };
    });

    // 3. Sort from highest match to lowest match
    matchedRoles.sort((a, b) => parseFloat(b.matchPercentage) - parseFloat(a.matchPercentage));

    // 4. Return only the top matches
    return matchedRoles.slice(0, topK);

  } catch (error) {
    console.error("Match Service Error:", error);
    throw error;
  }
}