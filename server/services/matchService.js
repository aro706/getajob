import Role from '../models/Role.js';
import { cosineSimilarity } from '../utils/similarity.js';

/**
 * Compares a resume embedding against all roles in the database
 * and returns the top matching roles.
 */
export async function findTopMatchingRoles(resumeEmbedding, topK = 3) {
  try {
    // 1. Fetch all roles from the database
    const allRoles = await Role.find({});

    if (!allRoles || allRoles.length === 0) {
      throw new Error("No roles found in the database. Did you run the seed script?");
    }

    // 2. Calculate the similarity score for each role
    const matchedRoles = allRoles.map((role) => {
      const score = cosineSimilarity(resumeEmbedding, role.embedding);
      
      return {
        id: role._id,
        title: role.title,
        description: role.description,
        score: score 
      };
    });

    // 3. Sort the roles by score in descending order (highest score first)
    matchedRoles.sort((a, b) => b.score - a.score);

    // 4. Return only the top K matches (e.g., top 3)
    return matchedRoles.slice(0, topK);

  } catch (error) {
    console.error("Error in findTopMatchingRoles:", error);
    throw error;
  }
}