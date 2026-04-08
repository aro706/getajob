import resumeService from "../services/resumeService.js";

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(
      "1. Extracting, generating embedding, and SAVING to database...",
    );

    // 👇 This function parses the PDF, saves it, AND updates all 35 role ranklists in the background!
    const savedResume = await resumeService.processResume(req.file);

    console.log(`-> Saved to DB with ID: ${savedResume._id}`);

    res.json({
      message:
        "Resume processed, saved to DB, and all ranklists updated successfully!",
      data: {
        resumeId: savedResume._id,
        parsedResume: {
          skills: savedResume.skills,
          experience: savedResume.experience,
        },
      },
    });
  } catch (err) {
    console.error("Resume Controller Error:", err);
    res.status(500).json({ error: "Processing failed" });
  }
};

export default uploadResume;
