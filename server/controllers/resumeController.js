import resumeService from "../services/resumeService.js";

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await resumeService.processResume(req.file);

    res.json({
      message: "Resume processed successfully",
      data: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
};

export default uploadResume