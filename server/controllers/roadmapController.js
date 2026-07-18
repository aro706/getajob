// server/controllers/roadmapController.js
import Resume from "../models/Resume.js";
import { generatePersonalizedRoadmap } from "../services/roadmapService.js";

export const getRoadmap = async (req, res) => {
  console.log("========================================");
  console.log("[CONTROLLER ENTRY] getRoadmap execution initiated.");
  console.log("[INCOMING BODY DATA]:", req.body);
  console.log("========================================");

  try {
    const { resumeId, goal, availableTime } = req.body;

    if (!resumeId || !goal || !availableTime) {
      console.warn("❌ Missing required body payload parameters:", { resumeId, goal, availableTime });
      return res.status(400).json({ 
        error: "Missing required fields: resumeId, goal, and availableTime." 
      });
    }

    console.log(`[DB LOOKUP] Fetching resume document for ID: ${resumeId}`);
    const userResume = await Resume.findById(resumeId);
    
    if (!userResume) {
      console.error(`❌ Resume with ID ${resumeId} not found in MongoDB.`);
      return res.status(404).json({ error: "Resume profile data not found. Please upload again." });
    }

    // Safety fallback initialization if skills array format varies
    const skillList = Array.isArray(userResume.skills) ? userResume.skills : [];
    console.log(`[SKILLS FOUND] Extracted User Skills: [${skillList.join(", ")}]`);
    console.log(`[PIPELINE START] Hitting generative AI service layer...`);

    // Parse absolute number block explicitly
    const parsedTime = parseInt(availableTime, 10);
    const roadmap = await generatePersonalizedRoadmap(skillList, goal, parsedTime);

    console.log("🚀 [SUCCESS] Personalized roadmap generated successfully.");
    return res.status(200).json({
      success: true,
      data: roadmap
    });

  } catch (error) {
    console.error("💥 [CONTROLLER CRASH] Breakdown in roadmap workflow process:", error);
    return res.status(500).json({ error: error.message });
  }
};