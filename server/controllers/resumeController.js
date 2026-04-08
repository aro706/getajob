import processResume from "../services/resumeService.js"; // Standard default import
import { findTopMatchingRoles } from "../services/matchService.js";
import { runOutreachPipeline } from "../services/outreachService.js";

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("\n================================================");
    console.log("1. Extracting, embedding, and saving resume...");

    // FIX: Call the function directly, NOT processResume.processResume()
    const savedResume = await processResume(req.file); 

    console.log("2. Finding top 3 matching roles...");
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);

    console.log("3. Initiating Deep Search (This will take a minute!)...");
    
    const fullOutreachResults = [];

    for (const match of matchedRoles) {
        const contacts = await runOutreachPipeline(match.title);
        
        fullOutreachResults.push({
            targetRole: match.title,
            matchPercentage: match.matchPercentage,
            totalFound: contacts.length,
            hrContacts: contacts
        });
    }

    console.log("\n4. COMPLETE!");
    console.log("================================================");

    res.json({
      message: "Ultimate Pipeline Complete!",
      data: {
        resumeId: savedResume._id,
        parsedResume: {
          skills: savedResume.skills,
          experience: savedResume.experience
        },
        outreachResults: fullOutreachResults 
      }
    });

  } catch (err) {
    console.error("Resume Controller Error:", err);
    res.status(500).json({ error: "Ultimate Processing failed" });
  }
};

export default uploadResume;