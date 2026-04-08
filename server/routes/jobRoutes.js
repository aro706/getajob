import express from "express";
import jobController from "../controllers/jobController.js";

const router = express.Router();

router.post("/post-and-match", jobController.postJob);

export default router;
