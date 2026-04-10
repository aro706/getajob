import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Role from "../models/Role.js";
import qdrantClient from "../config/qdrant.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const popularRoles = [
  { title: "Full Stack Developer", description: "Builds both front-end and back-end web applications. Skills: MERN stack, React, Node.js, Express, MongoDB, API design, system architecture." },
  { title: "Frontend Web Developer", description: "Develops user-facing web applications. Skills: React.js, Vue.js, Angular, HTML5, CSS3, Tailwind, TypeScript, UI/UX, responsive design." },
  { title: "Backend Software Engineer", description: "Builds scalable server-side logic and databases. Skills: Node.js, Python, Java, Go, C++, SQL, PostgreSQL, Redis, RESTful APIs, Microservices." },
  { title: "Software Engineer (Generalist)", description: "Designs and maintains complex software systems. Skills: Data Structures, Algorithms, Object-Oriented Programming, C++, Java, System Design." },
  { title: "iOS Developer", description: "Creates native mobile applications for Apple devices. Skills: Swift, Objective-C, Xcode, iOS SDK, CoreData, UIkit, SwiftUI." },
  { title: "Android Developer", description: "Creates native mobile applications for Android devices. Skills: Kotlin, Java, Android Studio, Android SDK, Jetpack Compose." },
  { title: "Data Scientist", description: "Analyzes complex data to build predictive models and inform decisions. Skills: Python, Machine Learning, Pandas, NumPy, Scikit-learn, statistical modeling." },
  { title: "DevOps Engineer", description: "Bridges development and operations to streamline deployments. Skills: AWS, Azure, Docker, Kubernetes, CI/CD pipelines, Terraform, Linux." },
  { title: "Cloud Architect", description: "Designs comprehensive cloud environments and infrastructure. Skills: AWS/GCP/Azure architecture, Serverless computing, Cloud security, Cost optimization." },
  { title: "Cybersecurity Analyst", description: "Protects IT infrastructure and monitors networks for security breaches. Skills: Network security, SIEM, Threat analysis, Incident response, Firewalls." }
];

async function generateEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function setupQdrantCollection() {
  console.log("🛠️ Setting up Qdrant Collection...");
  try {
    // Delete if exists so we can start fresh
    await qdrantClient.deleteCollection("roles");
  } catch (e) {
    // Ignore error if collection doesn't exist yet
  }
  
  // Create a clean collection designed for Gemini's 768 dimensions
  await qdrantClient.createCollection("roles", {
    vectors: { size: 3072, distance: "Cosine" }
  });
  console.log("✅ Qdrant 'roles' collection ready!");
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB...");

    await Role.deleteMany({});
    console.log("🧹 Cleared existing roles.");

    await setupQdrantCollection();

    let count = 1;

    for (const role of popularRoles) {
      console.log(`\n[${count}/${popularRoles.length}] Processing: ${role.title}...`);

      const textToEmbed = `${role.title}. ${role.description}`;
      const vectorArray = Array.from(await generateEmbedding(textToEmbed));

      // 1. Save to MongoDB
      const newRole = new Role({
        title: role.title,
        description: role.description,
        embedding: vectorArray,
      });
      await newRole.save();

      // 2. Upsert to Qdrant
      await qdrantClient.upsert("roles", {
        wait: true, // Tell Qdrant to wait until the save is physically complete
        points: [
          {
            id: crypto.randomUUID(), // Qdrant requires UUID format
            vector: vectorArray,
            payload: {
              mongoId: String(newRole._id), // Store Mongo reference here!
              title: role.title,
              description: role.description
            }
          }
        ]
      });

      console.log(`   🚀 Successfully saved to Qdrant!`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Prevent rate limiting
      count++;
    }

    console.log("\n🎉 Seeding complete! Qdrant is locked and loaded.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

seedDatabase();