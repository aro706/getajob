// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const dns = require("dns");

// // Fix for Node 17+ localhost MongoDB connection issues
// dns.setDefaultResultOrder("ipv4first");

// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import connectDB from "./config/db.js";

// // --- Route Imports ---
// import resumeRoutes from "./routes/resumeRoutes.js";
// import jobRoutes from "./routes/jobRoutes.js";

// // --- Model Imports ---
// import Role from "./models/Role.js";

// // --- App Initialization ---
// const app = express();

// // --- Database Connection ---
// connectDB();

// // --- Middleware ---
// app.use(cors());
// app.use(express.json());

// // --- API Routes ---
// // Note: It is best practice to keep route names plural (e.g., /api/resumes)
// app.use("/api/resumes", resumeRoutes);
// app.use("/api/jobs", jobRoutes);

// // --- Standalone Routes ---
// // Health check route
// app.get("/", (req, res) => {
//   res.send("API is running...");
// });

// // Roles route
// // (Tip: As your app grows, consider moving this into its own `routes/roleRoutes.js` file)
// app.get("/api/roles/rankings", async (req, res) => {
//   try {
//     const roles = await Role.find({})
//       .select("title rankedResumes") // Select only title and ranklist
//       .populate({
//         path: "rankedResumes.resumeId",
//         select: "skills experience", // Replaces ID with actual resume data
//       });

//     res.status(200).json({
//       success: true,
//       totalRoles: roles.length,
//       data: roles,
//     });
//   } catch (error) {
//     console.error("Error fetching rankings:", error);
//     res.status(500).json({ error: "Failed to fetch rankings" });
//   }
// });

// // --- Server Startup ---
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });


import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dns = require("dns");

// Fix for Node 17+ localhost MongoDB connection issues
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

// --- Route Imports ---
import resumeRoutes from "./routes/resumeRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
// NEW: Import the outreach routes
import outreachRoutes from "./routes/outreachRoutes.js"; 

// --- Model Imports ---
import Role from "./models/Role.js";

// --- App Initialization ---
const app = express();

// --- Database Connection ---
connectDB();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// Note: It is best practice to keep route names plural (e.g., /api/resumes)
app.use("/api/resumes", resumeRoutes);
app.use("/api/jobs", jobRoutes);
// NEW: Mount the outreach routes so they are accessible
app.use("/api/outreach", outreachRoutes); 

// --- Standalone Routes ---
// Health check route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Roles route
// (Tip: As your app grows, consider moving this into its own `routes/roleRoutes.js` file)
app.get("/api/roles/rankings", async (req, res) => {
  try {
    const roles = await Role.find({})
      .select("title rankedResumes"); // Removed .populate() entirely

    res.status(200).json({
      success: true,
      totalRoles: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("Error fetching rankings:", error);
    res.status(500).json({ error: "Failed to fetch rankings" });
  }
});

// --- Server Startup ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});