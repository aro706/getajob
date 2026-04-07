import processResume from "../services/resumeService.js";

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Fixed: Call processResume directly
    const result = await processResume(req.file);

    res.json({
      message: "Resume processed successfully",
      data: result
    });

  } catch (err) {
    console.error("Resume Controller Error:", err);
    res.status(500).json({ error: "Processing failed" });
  }
};

export default uploadResume;