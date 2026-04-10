import express from "express";
import { discoverJobsAndHR, generateDraft, sendEmail, searchHRContact } from "../controllers/outreachController.js";

const router = express.Router();

router.post("/discover", discoverJobsAndHR);
router.post("/generate-draft", generateDraft);
router.post("/send", sendEmail);
router.post("/search", searchHRContact); // New Verification Route

export default router;