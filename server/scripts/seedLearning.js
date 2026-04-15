import qdrantClient from "../config/qdrant.js";
import generateEmbedding from "../services/embeddingService.js";
import { v4 as uuidv4 } from "uuid";

// server/scripts/seedLearning.js

const learningData = [
  // Core Web & Software Development
  { goal: "Backend", content: "Node.js, Express, MongoDB, SQL, System Design, JWT Auth, Redis, Microservices. Resource: https://roadmap.sh/backend" },
  { goal: "Frontend", content: "React, Vue, Tailwind CSS, DOM Manipulation, TypeScript, Redux, Next.js. Resource: https://roadmap.sh/frontend" },
  { goal: "Full Stack", content: "MERN Stack, Next.js, PostgreSQL, Prisma, AWS Deployment, GraphQL. Resource: https://roadmap.sh/full-stack" },
  
  // Mobile & Game Development
  { goal: "Android Dev", content: "Kotlin, Jetpack Compose, Retrofit, MVVM Architecture, Room DB. Resource: https://roadmap.sh/android" },
  { goal: "iOS Dev", content: "Swift, SwiftUI, Combine, CoreData, Xcode, UIKit. Resource: https://roadmap.sh/ios" },
  { goal: "Game Dev", content: "C#, Unity, C++, Unreal Engine, Game Physics, Shaders, 3D Modeling. Resource: https://roadmap.sh/game-developer" },

  // Data Science & AI
  { goal: "DSA", content: "Big O, Arrays, Trees, Graphs, Dynamic Programming, Sorting, Searching Algorithms. Resource: https://leetcode.com/explore" },
  { goal: "ML", content: "Python, Scikit-Learn, Neural Networks, PyTorch, TensorFlow, Data Preprocessing. Resource: https://fast.ai" },
  { goal: "Data Science", content: "Pandas, Matplotlib, Statistics, SQL for Data, Tableau, R Programming. Resource: https://roadmap.sh/python" },
  { goal: "Data Engineering", content: "Apache Spark, Kafka, Hadoop, Airflow, Snowflake, ETL Pipelines. Resource: https://roadmap.sh/data-engineer" },

  // Specialized Technical Paths
  { goal: "DevOps", content: "Docker, Kubernetes, CI/CD, AWS/Azure/GCP, Terraform, Linux, Prometheus. Resource: https://roadmap.sh/devops" },
  { goal: "Cybersecurity", content: "Ethical Hacking, Network Security, Pen-Testing, OWASP Top 10, Cryptography. Resource: https://roadmap.sh/cyber-security" },
  { goal: "Blockchain", content: "Solidity, Ethereum, Smart Contracts, Web3.js, Rust (Solana), DeFi. Resource: https://roadmap.sh/blockchain" },
  { goal: "Cloud Computing", content: "AWS Solutions Architect, Azure Fundamentals, Serverless, IAM, VPC. Resource: https://roadmap.sh/aws" },

  // Quality & Management
  { goal: "QA Testing", content: "Selenium, Jest, Cypress, Unit Testing, Manual Testing, Load Testing. Resource: https://roadmap.sh/qa" },
  { goal: "Product Management", content: "Agile, Scrum, User Stories, Product Metrics, Wireframing, Roadmapping. Resource: https://roadmap.sh/product-manager" }
];

async function seed() {
  try {
    // Create the collection with 768 dimensions for Gemini
    await qdrantClient.createCollection("learning_resources", {
      vectors: { size: 768, distance: "Cosine" }
    });

    for (const item of learningData) {
      const vector = await generateEmbedding(item.content);
      await qdrantClient.upsert("learning_resources", {
        points: [{ id: uuidv4(), vector, payload: item }]
      });
    }
    console.log("✅ Learning resources seeded!");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
}
seed();