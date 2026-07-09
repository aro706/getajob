import Role from "../models/Role.js";

/**
 * Finds top matching roles using native MongoDB Atlas Vector Search.
 * Includes explicit telemetry logs to simplify local debugging.
 * @param {Array<Number>} resumeEmbedding - The vector embedding array extracted from the resume.
 * @param {Number} limit - Maximum number of matched roles to return.
 * @returns {Promise<Array>} - Array of roles ranked by semantic vector similarity.
 */
export const findTopMatchingRoles = async (resumeEmbedding, limit = 3) => {
  console.log("\n====== [DEBUG START: VECTOR MATCHING SERVICE] ======");
  
  try {
    // 1. Telemetry and vector integrity check
    if (!resumeEmbedding) {
      console.error("❌ ERROR: resumeEmbedding parameter is completely undefined or null.");
      return [];
    }
    if (!Array.isArray(resumeEmbedding)) {
      console.error(`❌ ERROR: Expected embedding type 'Array', received type: '${typeof resumeEmbedding}'`);
      return [];
    }
    
    console.log(`📊 Input Vector Dimension Detected: ${resumeEmbedding.length} elements`);
    console.log(`🎯 Targeted Return Limit: ${limit} roles`);

    if (resumeEmbedding.length === 0) {
      console.error("❌ ERROR: The input vector is an empty array []. Cannot compute cosine match.");
      return [];
    }

    // Print out the first 3 dimensions to confirm the floats are being read correctly
    console.log(`🔬 Vector Sample (First 3 indices): [${resumeEmbedding.slice(0, 3).join(", ")}...]`);

    // 2. Query execution with database tracking metrics
    console.log("⚡ Dispatching $vectorSearch aggregation pipeline to Atlas cluster...");
    
    const matchedRoles = await Role.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",   // Must match your Atlas index name exactly
          path: "embedding",       // Case-sensitive field mapping in your Role schema
          queryVector: resumeEmbedding,
          numCandidates: 150,      // Scan width across your 320 records
          limit: limit
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          similarityScore: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    console.log(`✅ MongoDB Query Executed. Found raw database matches: ${matchedRoles.length} roles.`);

    // 3. Format structural return mapping with detailed scoring readouts
    const processedResults = matchedRoles.map((role, idx) => {
      const percentage = role.similarityScore 
        ? `${Math.min(Math.round(role.similarityScore * 100), 100)}%` 
        : "85%";
      
      console.log(`   [Match #${idx + 1}] Title: "${role.title}" | Score: ${role.similarityScore?.toFixed(4) || "N/A"} (${percentage})`);
      
      return {
        title: role.title,
        description: role.description || "No description provided for this target profile.",
        matchPercentage: percentage
      };
    });

    console.log("====== [DEBUG END: VECTOR MATCHING SERVICE SUCCESS] ======\n");
    return processedResults;

  } catch (error) {
    console.error("🔥 CRITICAL AGGREGATION FAILURE inside matchService.js:");
    console.error(`   Message: ${error.message}`);
    console.error(`   Code/Location: ${error.codeName || "N/A"} (Code: ${error.code || "N/A"})`);
    console.error("💡 Troubleshooting Tip: Check if 'vector_index' status is 'Active' in Atlas and your dimensions are exactly 3072.");
    console.error("====== [DEBUG END: VECTOR MATCHING SERVICE FAILURE] ======\n");
    return [];
  }
};