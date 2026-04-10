import resumeService from "../services/resumeService.js";
import { findTopMatchingRoles } from "../services/matchService.js";
import { runOutreachPipeline } from "../services/outreachService.js";
import { generateEmailDrafts } from "../services/emailAgentService.js"; 
import { sendMail } from "../services/mailTransporter.js"; 
import Resume from "../models/Resume.js"; // 👈 ADDED: Required to fetch the resume in the pipeline
import crypto from "crypto";
import generateEmbedding from "../services/embeddingService.js";
import qdrantClient from "../config/qdrant.js";
// --------------------------------------------------------
// 1. ONLY UPLOAD, PARSE, AND STORE EMBEDDINGS
// --------------------------------------------------------
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("\n================================================");
    console.log("1. Extracting, embedding, and saving resume...");
    
    // This extracts text, embeds, and saves to MongoDB & Qdrant
    const savedResume = await resumeService(req.file);

    console.log("2. Parsing Complete! Sending Matrix to Client.");
    console.log("================================================");

    res.status(200).json({
      message: "Resume parsed and saved successfully!",
      data: {
        resumeId: savedResume._id,
        parsedResume: {
          skills: savedResume.skills || [],
          experience: savedResume.experience || [],
          projects: savedResume.projects || [] 
        }
      }
    });
  } catch (err) {
    console.error("Upload & Parse Error:", err);
    res.status(500).json({ error: "Failed to parse and save resume" });
  }
};

// --------------------------------------------------------
// 2. RUN THE MATCHING & OUTREACH PIPELINE
// --------------------------------------------------------
export const triggerPipeline = async (req, res) => {
  try {
    const { resumeId } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: "Resume ID is required to start the pipeline." });
    }

    console.log("\n================================================");
    console.log(`🚀 Starting pipeline for resume: ${resumeId}`);

    // Fetch the previously saved resume
    const savedResume = await Resume.findById(resumeId);
    if (!savedResume) {
      return res.status(404).json({ error: "Resume not found in database." });
    }

    console.log("1. Finding top matching roles...");
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);

    console.log("2. Initiating Deep Search & AI Outreach...");

    const fullOutreachResults = [];

    for (const match of matchedRoles) {
      console.log(`\n>> Target Role: ${match.title}`);
      
      // A. Find the HR contacts (Max 2 per company via your logic)
      const contacts = await runOutreachPipeline(match.title);
      const enrichedContacts = [];

      for (const hr of contacts) {
        let aiDrafts = null;
        let emailSentStatus = false;

        // B. Generate the AI Email Drafts
        if (hr.name && hr.company) {
           console.log(`   ✍️ Gemini is drafting emails for ${hr.name}...`);
           try {
             aiDrafts = await generateEmailDrafts(savedResume, hr.company, match.title, hr.name);
           } catch (draftError) {
             console.log(`   ⚠️ Draft failed for ${hr.name}: ${draftError.message}`);
           }
        }

        // C. Send the Email (The Live Ammunition)
        if (hr.email && hr.email !== "Unknown" && !hr.email.includes("example.com") && aiDrafts) {
            const subjectLine = `Application for ${match.title} role - Experienced Candidate`;
            
            console.log(`   🚀 Preparing to send email to ${hr.email}...`);
            
            // =================================================================
            // 🛑 SAFETY CATCH: UNCOMMENT THE TWO LINES BELOW TO ACTUALLY SEND!
            // =================================================================
            // await sendMail(hr.email, subjectLine, aiDrafts.professional);
            // emailSentStatus = true;
        }

        // Add everything to our final response object
        enrichedContacts.push({
          name: hr.name,
          role: hr.role,
          company: hr.company,
          linkedin: hr.linkedin,
          email: hr.email,
          source: hr.source,
          drafts: aiDrafts,       // The 3 variations from Gemini
          emailSent: emailSentStatus
        });
      }

      fullOutreachResults.push({
        targetRole: match.title,
        matchPercentage: match.matchPercentage,
        totalFound: contacts.length,
        hrContacts: enrichedContacts,
      });
    }

    console.log("\n3. GOD MODE COMPLETE!");
    console.log("================================================");

    res.status(200).json({
      message: "Ultimate Pipeline Complete!",
      data: {
        resumeId: savedResume._id,
        outreachResults: fullOutreachResults,
      },
    });
  } catch (err) {
    console.error("Pipeline Controller Error:", err);
    res.status(500).json({ error: "Ultimate Processing failed" });
  }
};

// --------------------------------------------------------
// 3. UPDATE RESUME DETAILS (Re-Embed & Sync both DBs)
// --------------------------------------------------------
export const updateResumeDetails = async (req, res) => {
  try {
    const { resumeId, skills, experience, projects } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: "Resume ID is required." });
    }

    console.log(`\n================================================`);
    console.log(`🔄 Updating details for Resume: ${resumeId}`);

    // 1. Format the new data
    const updatedData = {
      skills: skills || [],
      experience: experience || [],
      projects: projects || []
    };

    // 2. Generate a fresh embedding from the newly edited text
    console.log("   🧠 Generating new vector embedding...");
    const textToEmbed = JSON.stringify(updatedData);
    const newEmbedding = Array.from(await generateEmbedding(textToEmbed));

    // 3. Update MongoDB
    console.log("   💾 Saving updated details to MongoDB...");
    const updatedResume = await Resume.findByIdAndUpdate(
      resumeId,
      {
        skills: updatedData.skills,
        experience: updatedData.experience,
        projects: updatedData.projects,
        embedding: newEmbedding
      },
      { new: true } // Returns the updated document
    );

    if (!updatedResume) {
      return res.status(404).json({ error: "Resume not found in database." });
    }

    // 4. Update Qdrant
    console.log("   🌲 Syncing new vector to Qdrant...");
    
    // Step A: Delete the old vector associated with this mongoId
    await qdrantClient.delete("resumes", {
      wait: true,
      filter: {
        must: [
          { key: "mongoId", match: { value: String(resumeId) } }
        ]
      }
    });

    // Step B: Insert the new vector
    await qdrantClient.upsert("resumes", {
      wait: true,
      points: [
        {
          id: crypto.randomUUID(),
          vector: newEmbedding,
          payload: {
            mongoId: String(resumeId),
            skills: updatedData.skills.join(", ")
          }
        }
      ]
    });

    console.log("✅ Resume successfully updated in both databases!");
    console.log(`================================================\n`);

    res.status(200).json({
      message: "Resume details and embeddings updated successfully!",
      data: updatedResume
    });

  } catch (err) {
    console.error("Update Resume Error:", err);
    res.status(500).json({ error: "Failed to update resume details." });
  }
};