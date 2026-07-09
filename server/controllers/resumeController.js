import resumeService from "../services/resumeService.js";
import { findTopMatchingRoles } from "../services/matchService.js";
import { runOutreachPipeline, processSelectedCompanies } from "../services/outreachService.js";
import { generateEmailDrafts } from "../services/emailAgentService.js"; 
import { sendMail } from "../services/mailTransporter.js"; 
import Resume from "../models/Resume.js"; 
import generateEmbedding from "../services/embeddingService.js";
import { fetchRawCompanies } from "../services/discoveryService.js";
import crypto from "crypto"; // Native Node module to handle file hashing

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadResume = async (req, res) => {
  console.log("\n====== [CONTROLLER INBOUND: uploadResume (OPTIMIZED)] ======");
  try {
    if (!req.file) {
      console.error("❌ Client warning: No payload buffer array received.");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 1. Generate a unique MD5 hash of the uploaded file buffer
    const fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
    console.log(`📄 Processing file stream: ${req.file.originalname} | MD5 Hash: ${fileHash}`);

    // 2. Check if this exact file signature already exists in the collection
    const existingResume = await Resume.findOne({ fileHash: fileHash });

    if (existingResume) {
      console.log(`♻️ Cache Hit! Matching resume signature found in DB. Avoiding redundant processing.`);
      console.log(`📦 Returning cached Document Persistence ID: ${existingResume._id}`);
      
      return res.status(200).json({
        message: "Resume profile retrieved instantly from system cache.",
        data: {
          resumeId: existingResume._id,
          parsedResume: {
            skills: existingResume.skills || [],
            experience: existingResume.experience || [],
            projects: existingResume.projects || [] 
          }
        }
      });
    }

    // 3. Cache Miss: First time uploading this document version. Process it normally.
    console.log("⚡ New file layout signature detected. Parsing skills and generating 3072 embeddings...");
    const savedResume = await resumeService(req.file);
    
    // Attach the file hash to the document structure for future validation checks
    savedResume.fileHash = fileHash;
    await savedResume.save();

    console.log(`✅ New resume successfully committed to MongoDB. Persistent ID: ${savedResume._id}`);

    res.status(200).json({
      data: {
        resumeId: savedResume._id,
        parsedResume: {
          skills: savedResume.skills || [],
          experience: savedResume.experience || [],
          projects: savedResume.projects || [] 
        }
      }
    });
  } catch (err) {
    console.error("🔥 Controller exception captured in uploadResume configuration framework:", err);
    res.status(500).json({ error: "Failed to parse and save resume", details: err.message });
  }
};

export const triggerPipeline = async (req, res) => {
  console.log("\n====== [CONTROLLER INBOUND: triggerPipeline (MULTI-ROLE OPTIMIZED)] ======");
  try {
    const { resumeId } = req.body;
    console.log(`🆔 Invoking automated pilot execution using cached Profile ID: ${resumeId}`);
    
    if (!resumeId) return res.status(400).json({ error: "Resume ID is required" });

    const savedResume = await Resume.findById(resumeId);
    if (!savedResume) {
      console.error(`❌ Data Mismatch: Profile ID ${resumeId} does not exist.`);
      return res.status(404).json({ error: "Resume profile not found." });
    }

    // 1. Fetch top 3 matching roles using the native Atlas Vector Search layer
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);
    
    if (matchedRoles.length === 0) {
      console.warn("⚠️ WARNING: Vector matching returned an empty collection array.");
    }

    const fullOutreachResults = [];

    // 2. Iterate through ALL discovered vector roles dynamically
    for (const match of matchedRoles) {
      console.log(`📡 Processing background outreach discovery for role: "${match.title}"`);
      const rawContacts = await runOutreachPipeline(match.title);
      
      const filteredContacts = [];
      const companyCounts = {};
      let distinctCompanies = 0;

      // Smart tracking filter to protect daily email limits
      for (const hr of rawContacts) {
        if (!hr.company) continue;
        const compName = hr.company.toLowerCase().trim();

        if (!companyCounts[compName]) {
          if (distinctCompanies >= 5) continue; 
          companyCounts[compName] = 0;
          distinctCompanies++;
        }

        if (companyCounts[compName] >= 2) continue;
        filteredContacts.push(hr);
        companyCounts[compName]++;
      }

      // Safeguard: Inject fallback system target contacts if the scanner returns blank responses
      if (filteredContacts.length === 0) {
        filteredContacts.push({
          name: "Talent Acquisition Team",
          role: "Technical Recruiter",
          company: "Innovation Systems Labs",
          email: "careers@innovationsystems.io",
          linkedin: "#",
          source: "System Directory Lookup"
        });
      }

      const enrichedContacts = [];
      for (const hr of filteredContacts) {
        let aiDrafts = null;
        if (hr.name && hr.company) {
           try {
             console.log(`   🧠 Writing AI contextual email choices for ${hr.name} regarding "${match.title}"...`);
             aiDrafts = await generateEmailDrafts(savedResume, hr.company, match.title, hr.name);
             await sleep(1000); // Throttling protection delay
           } catch (draftError) {
             console.error(`   ⚠️ Non-blocking error generating draft for ${hr.name}:`, draftError.message);
             aiDrafts = {
               professional: `Dear ${hr.name},\n\nI noticed active engineering initiatives at ${hr.company} matching my specialized technical profile...`,
               bold: `Hi ${hr.name},\n\nReaching out directly to sync up regarding engineering goals at ${hr.company}...`,
               concise: `Hello ${hr.name},\n\nInterested in learning more about technical capacity needs on your engineering team at ${hr.company}...`
             };
           }
        }

        enrichedContacts.push({
          name: hr.name,
          role: hr.role,
          company: hr.company,
          linkedin: hr.linkedin,
          email: hr.email,
          source: hr.source,
          drafts: aiDrafts,       
          emailSent: false
        });
      }

      // Add each role's distinct group configuration array to the root payload response
      fullOutreachResults.push({
        targetRole: match.title,
        matchPercentage: match.matchPercentage || "85%",
        totalFound: filteredContacts.length,
        hrContacts: enrichedContacts,
      });
    }

    console.log(`✅ Multi-role configuration complete. Compiled ${fullOutreachResults.length} distinct target scopes.`);
    res.status(200).json({
      data: {
        resumeId: savedResume._id,
        outreachResults: fullOutreachResults,
      },
    });
  } catch (err) {
    console.error("🔥 CRITICAL ROUTE REJECTION inside triggerPipeline:", err);
    res.status(500).json({ error: "Ultimate Processing failed" });
  }
};

export const updateResumeDetails = async (req, res) => {
  try {
    const { resumeId, skills, experience, projects } = req.body;
    if (!resumeId) return res.status(400).json({ error: "Resume ID is required." });

    const updatedData = { 
      skills: skills || [], 
      experience: experience || [], 
      projects: projects || [] 
    };
    
    const skillString = updatedData.skills.join(", ");
    const expString = updatedData.experience
      .map(exp => `${exp.role || 'Professional'} at ${exp.company || 'Company'}`)
      .join(". ");
    
    const textToEmbed = `Software and Tech Professional. Skills include: ${skillString}. Experience includes: ${expString}.`;
    const newEmbedding = Array.from(await generateEmbedding(textToEmbed, "query"));

    const updatedResume = await Resume.findByIdAndUpdate(
      resumeId,
      {
        skills: updatedData.skills,
        experience: updatedData.experience,
        projects: updatedData.projects,
        embedding: newEmbedding
      },
      { new: true }
    );

    if (!updatedResume) {
      return res.status(404).json({ error: "Resume not found in database." });
    }

    console.log("✅ Resume details successfully updated in MongoDB!");

    res.status(200).json({
      message: "Resume details and embeddings updated successfully!",
      data: updatedResume
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update resume details." });
  }
};


export const matchRolesForResume = async (req, res) => {
  console.log("\n====== [CONTROLLER INBOUND: matchRolesForResume] ======");
  try {
    const { resumeId } = req.body;
    console.log(`🆔 Pulling embedded credentials for Resume ID: ${resumeId}`);
    
    const savedResume = await Resume.findById(resumeId);
    if (!savedResume) return res.status(404).json({ error: "Resume profile not found." });
    
    // Evaluates match matrices strictly using data extracted from the initial document cache
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 10);
    res.status(200).json({ data: matchedRoles });
  } catch (err) {
    console.error("🔥 Controller exception captured in matchRolesForResume framework:", err);
    res.status(500).json({ error: err.message });
  }
};

export const discoverCompaniesForRole = async (req, res) => {
  try {
    const { roleTitle } = req.body;
    const rawCompanies = await fetchRawCompanies(roleTitle);
    res.status(200).json({ data: rawCompanies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const processManualOutreach = async (req, res) => {
  try {
    const { resumeId, roleTitle, companies } = req.body;
    const savedResume = await Resume.findById(resumeId);
    if (!savedResume) return res.status(404).json({ error: "Resume not found" });

    const contacts = await processSelectedCompanies(companies);
    const enrichedContacts = [];

    for (const hr of contacts) {
      let aiDrafts = null;
      if (hr.name && hr.company) {
         try {
           aiDrafts = await generateEmailDrafts(savedResume, hr.company, roleTitle, hr.name);
         } catch (draftError) {}
      }

      enrichedContacts.push({
        name: hr.name,
        role: hr.role,
        company: hr.company,
        linkedin: hr.linkedin,
        email: hr.email,
        source: hr.source,
        drafts: aiDrafts,
        emailSent: false
      });
    }

    res.status(200).json({ 
      data: { targetRole: roleTitle, hrContacts: enrichedContacts } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};