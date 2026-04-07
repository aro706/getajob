import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config(); // MUST be first

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import resumeRoutes from "./routes/resumeRoutes.js";

const app = express();

// 🔍 DEBUG (remove later)
console.log("MONGO_URI:", process.env.MONGO_URI);

// ---------------- DB CONNECT ----------------
connectDB();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());

// ---------------- ROUTES ----------------
app.get("/", (req, res) => {
  res.send("API running");
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