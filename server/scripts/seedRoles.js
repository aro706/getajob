import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Role from "../models/Role.js"; // MUST include .js extension

// 1. Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Define the list of jobs we want in our database
const popularRoles = [
  {
    title: "Full Stack Developer",
    description: "Builds front-end and back-end web applications. Skills: MERN stack, React, Node.js, Express, MongoDB, JavaScript, API design, system architecture."
  },
  {
    title: "Frontend Developer",
    description: "Develops user-facing web applications. Skills: React, Vue, Angular, HTML, CSS, Tailwind, JavaScript, UI/UX, responsive design."
  },
  {
    title: "Backend Developer",
    description: "Builds server-side logic and databases. Skills: Node.js, Python, Java, C++, SQL, PostgreSQL, MongoDB, REST APIs."
  },
  {
    title: "Data Scientist",
    description: "Analyzes complex data to help make business decisions. Skills: Python, Machine Learning, SQL, Pandas, NumPy, statistical modeling."
  },
  {
    title: "DevOps Engineer",
    description: "Bridges development and operations to streamline deployments. Skills: AWS, Docker, Kubernetes, CI/CD pipelines, Linux."
  }
];

// 3. Function to get embeddings from Gemini
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("Embedding generation failed:", err);
    throw err;
  }
}

// 4. Main function to run the process
async function seedDatabase() {
  try {
    // Connect to MongoDB using the URI from your .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Clear existing roles so we don't create duplicates
    await Role.deleteMany({});
    console.log("Cleared existing roles.");

    // Loop through our list and save each one
    for (const role of popularRoles) {
      console.log(`Generating embedding for: ${role.title}...`);
      
      // We combine title and description for a richer embedding
      const textToEmbed = `${role.title}. ${role.description}`;
      const vector = await generateEmbedding(textToEmbed);

      const newRole = new Role({
        title: role.title,
        description: role.description,
        embedding: vector
      });

      await newRole.save();
      console.log(`Saved ${role.title} successfully!`);
    }

    console.log("Seeding complete! You can safely close this terminal process.");
    process.exit(0);

  } catch (err) {
    console.error("Error during seeding:", err);
    process.exit(1);
  }
}

// Execute the script
seedDatabase();