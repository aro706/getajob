import Resume from "../models/Resume.js";
import { generatePersonalizedRoadmap } from "../services/roadmapService.js";

export const getRoadmap = async (req, res) => {
  try {
    const { resumeId, goal, availableTime } = req.body;

    if (!resumeId || !goal || !availableTime) {
      return res.status(400).json({ 
        error: "Missing required fields: resumeId, goal, and availableTime." 
      });
    }

    // Fetch the specific user's skills from MongoDB
    const userResume = await Resume.findById(resumeId);
    if (!userResume) {
      return res.status(404).json({ error: "Resume not found in database." });
    }

    const roadmap = await generatePersonalizedRoadmap(userResume.skills, goal, availableTime);

    res.status(200).json({
      success: true,
      data: roadmap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};