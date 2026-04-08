import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

// 1. Import your routes
import resumeRoutes from "./routes/resumeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";

// 2. Initialize the app FIRST
const app = express();

// 3. Connect to the database
connectDB();

// 4. Setup Middleware (Must come before routes!)
app.use(cors());
app.use(express.json());

// 5. Attach Routes (Now 'app' exists)
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});



// ---------------- ROUTES ----------------
app.get("/", (req, res) => {
  res.send("API running");
});

// ✅ ADD THIS
app.use("/api/resume", resumeRoutes);



// ---------------- SERVER ----------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
