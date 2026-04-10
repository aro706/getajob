import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Resume from "../models/Resume.js";
import pineconeIndex from "../config/pinecone.js";

async function syncExistingResumes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB...");

    const resumes = await Resume.find({});

    if (resumes.length === 0) {
      console.log("No resumes found to sync.");
      process.exit(0);
    }

    console.log(`Found ${resumes.length} Resumes. Syncing to Pinecone 'resumes' namespace...`);

    const pineconeRecords = resumes.map(resume => ({
      id: resume._id.toString(),
      values: resume.embedding,
      metadata: {
        type: 'resume',
        skills: (resume.skills || []).join(", ")
      }
    }));

    // Chunk the uploads to avoid Pinecone payload limits
    const chunkSize = 100;
    for (let i = 0; i < pineconeRecords.length; i += chunkSize) {
      const chunk = pineconeRecords.slice(i, i + chunkSize);
      await pineconeIndex.namespace('resumes').upsert(chunk);
      console.log(`Upserted ${i + chunk.length}/${pineconeRecords.length} resumes...`);
    }

    console.log("🎉 All existing resumes have been successfully synced to Pinecone!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync Error:", err);
    process.exit(1);
  }
}

syncExistingResumes();