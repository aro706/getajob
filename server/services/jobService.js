import generateEmbedding from "./embeddingService.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { cosineSimilarity } from "../utils/similarity.js";

async function postJobAndFindMatches(jobData) {
  // 1. Generate embedding for the job description
  const jobEmbedding = await generateEmbedding(jobData.description);

  // 2. Save the job profile to the database
  const newJob = new Job({
    title: jobData.title,
    description: jobData.description,
    embedding: jobEmbedding,
  });
  await newJob.save();

  // 3. Fetch all stored resumes to compare against
  const allResumes = await Resume.find({});

  // 4. Calculate cosine similarity for each resume
  const matches = allResumes.map((resume) => {
    const score = cosineSimilarity(jobEmbedding, resume.embedding);
    return {
      resumeId: resume._id,
      parsedData: resume.parsedData,
      similarityScore: score,
    };
  });

  // 5. Sort by highest score (closest match to 1.0)
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  // 6. Return the top 5 matches
  const topMatches = matches.slice(0, 5);

  return {
    job: newJob,
    topMatches: topMatches,
  };
}

export default { postJobAndFindMatches };
