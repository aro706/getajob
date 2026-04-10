import express from "express";
import { discoverJobsAndHR, generateDraft, sendEmail } from "../controllers/outreachController.js";

const router = express.Router();

// Existing route
router.post("/discover", discoverJobsAndHR);

// New AI Drafting and Sending routes
router.post("/generate-draft", generateDraft);
router.post("/send", sendEmail);

export default router;