import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Role from "../models/Role.js";
import Resume from "../models/Resume.js";
import { cosineSimilarity } from "../utils/similarity.js";

async function syncExistingResumes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB...");

    // 1. Fetch all roles and resumes
    const roles = await Role.find({});
    const resumes = await Resume.find({});

    if (roles.length === 0)
      throw new Error("No roles found. Run seed script first.");
    if (resumes.length === 0)
      console.log("No resumes found to sync. That's fine!");

    console.log(
      `Found ${roles.length} Roles and ${resumes.length} Resumes. Syncing now...`,
    );

    // 2. Loop through every role
    for (const role of roles) {
      // Clear out the old ranklist just in case we run this twice
      role.rankedResumes = [];

      // 3. Score every resume against this role
      for (const resume of resumes) {
        const score = cosineSimilarity(role.embedding, resume.embedding);
        role.rankedResumes.push({
          resumeId: resume._id,
          score: score,
        });
      }

      // 4. Sort the ranklist so the highest score (best match) is at the top [index 0]
      role.rankedResumes.sort((a, b) => b.score - a.score);

      // 5. Save the updated role
      await role.save();
    }

    console.log(
      "🎉 All existing resumes have been successfully scored and ranked!",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync Error:", err);
    process.exit(1);
  }
}

syncExistingResumes();
