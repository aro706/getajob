import express from "express";
import { discoverJobsAndHR } from "../controllers/outreachController.js";

const router = express.Router();

// This creates the POST route. 
// When mounted in server.js, the full URL will likely be: http://localhost:5000/api/outreach/discover
router.post("/discover", discoverJobsAndHR);

export default router;