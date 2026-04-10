import generateEmbedding from "./embeddingService.js";
import Resume from "../models/Resume.js";
import qdrantClient from "../config/qdrant.js";

async function postJobAndFindMatches(jobData) {
  const jobEmbedding = Array.from(await generateEmbedding(jobData.description));

  // 1. Find matched job categories from 'roles' collection
  const roleResults = await qdrantClient.search("roles", {
    vector: jobEmbedding,
    limit: 3,
    with_payload: true
  });
  const matchedJobCategories = roleResults.map(r => r.payload.title);

  // 2. Find top 10 best candidates directly from 'resumes' collection
  const resumeResults = await qdrantClient.search("resumes", {
    vector: jobEmbedding,
    limit: 10,
    with_payload: true
  });

  if (!resumeResults || resumeResults.length === 0) {
    return { matchedJobCategories, topCandidates: [] };
  }

  // 3. Fetch the actual resume details from MongoDB using the linked mongoId
  const topResumes = await Promise.all(
    resumeResults.map(async (match) => {
      const resume = await Resume.findById(match.payload.mongoId);
      if(!resume) return null;
      return {
        resumeId: resume._id,
        skills: resume.skills,
        experience: resume.experience,
        matchScore: (match.score * 100).toFixed(2) + "%", 
      };
    })
  );

  return {
    matchedJobCategories,
    topCandidates: topResumes.filter(r => r !== null), 
  };
}

export default { postJobAndFindMatches };