import processResume from "../services/resumeService.js";
import { findTopMatchingRoles } from "../services/matchService.js";

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("1. Extracting, generating embedding, and SAVING to database...");
    // FIXED: Call the function directly!
    const savedResume = await processResume(req.file);

    console.log(`-> Saved to DB with ID: ${savedResume._id}`);

    console.log("2. Calculating match scores against database roles...");
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);

    res.json({
      message: "Resume processed, saved to DB, and matched successfully!",
      data: {
        resumeId: savedResume._id,
        parsedResume: {
          skills: savedResume.skills,
          experience: savedResume.experience
        },
        topMatches: matchedRoles // Outputs best job titles!
      }
    });

  } catch (err) {
    console.error("Resume Controller Error:", err);
    res.status(500).json({ error: "Processing failed" });
  }
};

export default uploadResume;