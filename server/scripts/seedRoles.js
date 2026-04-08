import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Role from "../models/Role.js"; // MUST include .js extension

// 1. Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. Define 35 Industry Standard Tech Roles
const popularRoles = [
  // --- WEB & SOFTWARE ENGINEERING ---
  {
    title: "Full Stack Developer",
    description:
      "Builds both front-end and back-end web applications. Skills: MERN stack, React, Node.js, Express, MongoDB, API design, system architecture.",
  },
  {
    title: "Frontend Web Developer",
    description:
      "Develops user-facing web applications. Skills: React.js, Vue.js, Angular, HTML5, CSS3, Tailwind, TypeScript, UI/UX, responsive design.",
  },
  {
    title: "Backend Software Engineer",
    description:
      "Builds scalable server-side logic and databases. Skills: Node.js, Python, Java, Go, C++, SQL, PostgreSQL, Redis, RESTful APIs, Microservices.",
  },
  {
    title: "Software Engineer (Generalist)",
    description:
      "Designs and maintains complex software systems. Skills: Data Structures, Algorithms, Object-Oriented Programming, C++, Java, System Design.",
  },

  // --- MOBILE DEVELOPMENT ---
  {
    title: "iOS Developer",
    description:
      "Creates native mobile applications for Apple devices. Skills: Swift, Objective-C, Xcode, iOS SDK, CoreData, UIkit, SwiftUI.",
  },
  {
    title: "Android Developer",
    description:
      "Creates native mobile applications for Android devices. Skills: Kotlin, Java, Android Studio, Android SDK, Jetpack Compose.",
  },
  {
    title: "Cross-Platform Mobile Developer",
    description:
      "Builds mobile apps that run on multiple platforms from a single codebase. Skills: React Native, Flutter, Dart, Mobile UI design.",
  },

  // --- DATA & ARTIFICIAL INTELLIGENCE ---
  {
    title: "Data Scientist",
    description:
      "Analyzes complex data to build predictive models and inform decisions. Skills: Python, Machine Learning, Pandas, NumPy, Scikit-learn, statistical modeling.",
  },
  {
    title: "Machine Learning Engineer",
    description:
      "Designs and deploys AI models into production. Skills: Python, TensorFlow, PyTorch, Deep Learning, Model Deployment, MLOps.",
  },
  {
    title: "Data Engineer",
    description:
      "Builds infrastructure and pipelines for data generation and processing. Skills: SQL, ETL, Apache Spark, Hadoop, Kafka, Snowflake, Airflow.",
  },
  {
    title: "Data Analyst",
    description:
      "Translates numbers and data into plain English to help businesses make decisions. Skills: SQL, Excel, Tableau, Power BI, Data Visualization.",
  },
  {
    title: "NLP Engineer",
    description:
      "Builds systems that understand human language. Skills: Natural Language Processing, LLMs, Transformers, HuggingFace, OpenAI API, PyTorch.",
  },
  {
    title: "Computer Vision Engineer",
    description:
      "Builds AI systems that process and analyze visual data. Skills: OpenCV, YOLO, Image Processing, Deep Learning, C++, Python.",
  },

  // --- CLOUD, DEVOPS & INFRASTRUCTURE ---
  {
    title: "DevOps Engineer",
    description:
      "Bridges development and operations to streamline deployments. Skills: AWS, Azure, Docker, Kubernetes, CI/CD pipelines, Terraform, Linux.",
  },
  {
    title: "Site Reliability Engineer (SRE)",
    description:
      "Ensures software systems are scalable and highly available. Skills: Incident management, Monitoring, Grafana, Prometheus, Scripting, Automation.",
  },
  {
    title: "Cloud Architect",
    description:
      "Designs comprehensive cloud environments and infrastructure. Skills: AWS/GCP/Azure architecture, Serverless computing, Cloud security, Cost optimization.",
  },
  {
    title: "Database Administrator (DBA)",
    description:
      "Maintains, secures, and operates databases. Skills: MySQL, PostgreSQL, Oracle, Database optimization, Backups, Data migration.",
  },

  // --- CYBERSECURITY ---
  {
    title: "Cybersecurity Analyst",
    description:
      "Protects IT infrastructure and monitors networks for security breaches. Skills: Network security, SIEM, Threat analysis, Incident response, Firewalls.",
  },
  {
    title: "Penetration Tester (Ethical Hacker)",
    description:
      "Simulates cyberattacks to identify and fix security vulnerabilities. Skills: Kali Linux, Metasploit, Web application security, Network hacking, Cryptography.",
  },
  {
    title: "DevSecOps Engineer",
    description:
      "Integrates security practices into the DevOps pipeline. Skills: CI/CD security, SAST/DAST, Vulnerability scanning, Container security.",
  },

  // --- DESIGN & PRODUCT ---
  {
    title: "UI/UX Designer",
    description:
      "Designs user interfaces and optimizes the user experience. Skills: Figma, Adobe XD, Wireframing, Prototyping, User Research, Interaction design.",
  },
  {
    title: "Product Manager (Technical)",
    description:
      "Leads product strategy, roadmapping, and works closely with engineering teams. Skills: Agile, Scrum, Jira, Roadmap planning, Technical translation.",
  },
  {
    title: "Scrum Master / Agile Coach",
    description:
      "Facilitates agile development processes and removes team blockers. Skills: Agile methodologies, Sprint planning, Kanban, Team leadership.",
  },

  // --- TESTING & QUALITY ASSURANCE ---
  {
    title: "QA Automation Engineer",
    description:
      "Writes scripts to automatically test software. Skills: Selenium, Cypress, Playwright, Jest, TestNG, Automated testing pipelines.",
  },
  {
    title: "Software Development Engineer in Test (SDET)",
    description:
      "Develops testing tools and frameworks alongside software. Skills: Java, Python, API Testing, Performance testing, Load testing.",
  },

  // --- NICHE / SPECIALIZED TECH ---
  {
    title: "Blockchain / Web3 Developer",
    description:
      "Builds decentralized applications and smart contracts. Skills: Solidity, Ethereum, Web3.js, Ethers.js, Smart Contracts, Cryptography.",
  },
  {
    title: "Embedded Systems Engineer",
    description:
      "Develops software for non-computer devices and microcontrollers. Skills: C, C++, RTOS, Microcontrollers, IoT, Hardware debugging.",
  },
  {
    title: "Game Developer (Unity)",
    description:
      "Builds 2D and 3D video games using the Unity engine. Skills: Unity3D, C#, Game physics, UI programming, 3D math.",
  },
  {
    title: "Game Developer (Unreal)",
    description:
      "Builds high-fidelity games using the Unreal Engine. Skills: Unreal Engine, C++, Blueprints, 3D rendering, Multiplayer networking.",
  },
  {
    title: "AR/VR Developer",
    description:
      "Creates augmented and virtual reality experiences. Skills: Unity, Unreal, Oculus SDK, ARKit, ARCore, Spatial computing.",
  },
  {
    title: "Salesforce Developer",
    description:
      "Customizes and develops applications on the Salesforce platform. Skills: Apex, Visualforce, Lightning Web Components (LWC), SOQL.",
  },
  {
    title: "Solutions Architect",
    description:
      "Designs software solutions that meet specific business needs and client requirements. Skills: Enterprise architecture, B2B integration, Cloud services.",
  },
];

// Helper to wait to avoid API Rate Limits
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 3. Function to get embeddings from Gemini
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("Embedding generation failed:", err.message || err);
    throw err;
  }
}

// 4. Main function to run the process
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB...");

    // Clear existing roles
    await Role.deleteMany({});
    console.log("🧹 Cleared existing roles.");

    // Loop through our list and save each one
    let count = 1;
    for (const role of popularRoles) {
      console.log(
        `[${count}/${popularRoles.length}] Generating embedding for: ${role.title}...`,
      );

      const textToEmbed = `${role.title}. ${role.description}`;
      const vector = await generateEmbedding(textToEmbed);

      const newRole = new Role({
        title: role.title,
        description: role.description,
        embedding: vector,
        rankedResumes: [], // Initializes the empty ranklist bucket
      });

      await newRole.save();
      console.log(`   ✔️ Saved successfully!`);

      // Pause for 1.5 seconds to respect Google's API Rate limits
      await delay(1500);
      count++;
    }

    console.log(
      "🎉 Seeding complete! 32 roles added. You can safely close this terminal (Ctrl+C).",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

// Execute the script
seedDatabase();
