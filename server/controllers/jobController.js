import jobService from "../services/jobService.js";

const postJob = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const result = await jobService.postJobAndFindMatches({
      title,
      description,
    });

    res.status(201).json({
      message: "Job posted and top candidates matched successfully",
      data: result,
    });
  } catch (err) {
    console.error("Job matching error:", err);
    res.status(500).json({ error: "Failed to process job and find matches" });
  }
};

export default { postJob };
