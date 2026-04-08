import jobService from "../services/jobService.js";

const postJob = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (
      !title ||
      typeof title !== "string" ||
      title.trim() === "" ||
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "Valid title and description strings are required" });
    }

    const result = await jobService.postJobAndFindMatches({
      title: title.trim(),
      description: description.trim(),
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
