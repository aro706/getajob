import generateEmbedding from "./embeddingService.js";
import Resume from "../models/Resume.js";
import Role from "../models/Role.js";

async function postJobAndFindMatches(jobData) {
  const jobEmbedding = Array.from(await generateEmbedding(jobData.description));

  // 1. Find matched job categories from Roles collection
  const matchedRoles = await Role.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: jobEmbedding,
        numCandidates: 50,
        limit: 3
      }
    }
  ]);
  const matchedJobCategories = matchedRoles.map(r => r.title);

  // 2. Find top 10 best candidates directly from Resumes collection
  const topResumes = await Resume.aggregate([
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: jobEmbedding,
        numCandidates: 100,
        limit: 10
      }
    },
    {
      $project: {
        _id: 1,
        skills: 1,
        experience: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ]);

  if (!topResumes || topResumes.length === 0) {
    return { matchedJobCategories, topCandidates: [] };
  }

  const formattedCandidates = topResumes.map(resume => ({
    resumeId: resume._id,
    skills: resume.skills,
    experience: resume.experience,
    matchScore: (resume.score * 100).toFixed(2) + "%", 
  }));

  return {
    matchedJobCategories,
    topCandidates: formattedCandidates, 
  };
}

export default { postJobAndFindMatches };