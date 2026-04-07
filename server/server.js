const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config(); // MUST be first

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

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

// ---------------- SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});