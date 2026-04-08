import generateEmbedding from "./embeddingService.js";
import Role from "../models/Role.js";
import Resume from "../models/Resume.js";
import { cosineSimilarity } from "../utils/similarity.js";

async function postJobAndFindMatches(jobData) {
  // 1. Generate embedding for the employer's new job description
  const jobEmbedding = await generateEmbedding(jobData.description);

  // 2. Fetch all 35 predefined standard roles from DB
  const standardRoles = await Role.find({});
  if (standardRoles.length === 0) {
    throw new Error(
      "No Standard Roles found in the database. Please seed them first.",
    );
  }

  // 3. Find the Top 3 matching Standard Roles
  const roleMatches = standardRoles
    .map((role) => ({
      role: role,
      similarityToJob: cosineSimilarity(jobEmbedding, role.embedding),
    }))
    .sort((a, b) => b.similarityToJob - a.similarityToJob)
    .slice(0, 3); // Get Top 3 roles

  // 4. Merge their ranklists, taking the TOP 10 from each bucket
  const candidateMap = new Map();

  roleMatches.forEach((match) => {
    const weight = match.similarityToJob;

    // 👇 CHANGED TO 10: Grabs up to 10 profiles from this specific role
    match.role.rankedResumes.slice(0, 10).forEach((rankedItem) => {
      const resId = rankedItem.resumeId.toString();

      const finalScore = rankedItem.score * weight;

      if (!candidateMap.has(resId) || candidateMap.get(resId) < finalScore) {
        candidateMap.set(resId, finalScore);
      }
    });
  });

  // 5. Sort the pooled candidates (max 30) to find the absolute best ones
  const sortedCandidates = Array.from(candidateMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // 👇 CHANGED TO 10: Pick the final top 10 profiles overall

  // 6. Fetch the actual resume details to send to the employer
  const topResumes = await Promise.all(
    sortedCandidates.map(async ([resumeId, score]) => {
      const resume = await Resume.findById(resumeId);
      return {
        resumeId: resume._id,
        skills: resume.skills,
        experience: resume.experience,
        matchScore: (score * 100).toFixed(2) + "%", // Making it a pretty percentage!
      };
    }),
  );

  return {
    matchedJobCategories: roleMatches.map((r) => r.role.title),
    topCandidates: topResumes,
  };
}

export default { postJobAndFindMatches };
