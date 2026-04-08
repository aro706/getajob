import express from "express";
import jobController from "../controllers/jobController.js"; // adjust path as needed

const router = express.Router();

// This makes the full path: /api/jobs/post
router.post("/post", jobController.postJob);

export default router;
