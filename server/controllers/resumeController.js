import resumeService from "../services/resumeService.js";
import { findTopMatchingRoles } from "../services/matchService.js";
import { runOutreachPipeline, processSelectedCompanies } from "../services/outreachService.js";
import { generateEmailDrafts } from "../services/emailAgentService.js"; 
import { sendMail } from "../services/mailTransporter.js"; 
import Resume from "../models/Resume.js"; 
import generateEmbedding from "../services/embeddingService.js";
import { fetchRawCompanies } from "../services/discoveryService.js";

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`\n📄 Starting upload process for: ${req.file.originalname}`);
    
    // Process the resume
    const savedResume = await resumeService(req.file);

    console.log(`✅ Resume processed successfully! ID: ${savedResume._id}`);

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
    console.error("\n🔥 FATAL UPLOAD ERROR DETECTED:");
    console.error(err);
    
    res.status(500).json({ 
      error: "Failed to parse and save resume", 
      details: err.message 
    });
  }
};
// Add this helper function right above triggerPipeline
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const triggerPipeline = async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: "Resume ID is required" });

    const savedResume = await Resume.findById(resumeId);
    if (!savedResume) return res.status(404).json({ error: "Resume not found" });

    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);
    const fullOutreachResults = [];

    for (const match of matchedRoles) {
      const rawContacts = await runOutreachPipeline(match.title);
      
      // -----------------------------------------------------------------
      // 🚀 THE SMART FILTER: Max 5 Companies, Max 2 HRs per Company
      // -----------------------------------------------------------------
      const filteredContacts = [];
      const companyCounts = {};
      let distinctCompanies = 0;

      for (const hr of rawContacts) {
        if (!hr.company) continue; // Skip if no company name
        
        // Normalize company name to catch slight variations (e.g., "Tudip" vs "tudip")
        const compName = hr.company.toLowerCase().trim();

        if (!companyCounts[compName]) {
          // If we already have 5 distinct companies, ignore any new companies
          if (distinctCompanies >= 5) continue; 
          
          companyCounts[compName] = 0;
          distinctCompanies++;
        }

        // If we already have 2 HRs from this specific company, skip them
        if (companyCounts[compName] >= 2) continue;

        // If they passed the checks, add them to our final list!
        filteredContacts.push(hr);
        companyCounts[compName]++;
      }
      // -----------------------------------------------------------------

      const enrichedContacts = [];

      // Now we only ask Gemini to write emails for the strictly filtered list!
      for (const hr of filteredContacts) {
        let aiDrafts = null;
        if (hr.name && hr.company) {
           try {
             aiDrafts = await generateEmailDrafts(savedResume, hr.company, match.title, hr.name);
             
             // 🐢 THE SPEED LIMIT: Wait 2 seconds before writing the next email
             // This prevents the "429 Too Many Requests" concurrency error!
             await sleep(2000); 
           } catch (draftError) {
             console.error(`⚠️ Failed to draft email for ${hr.name}:`, draftError.message);
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

      fullOutreachResults.push({
        targetRole: match.title,
        matchPercentage: match.matchPercentage,
        totalFound: filteredContacts.length,
        hrContacts: enrichedContacts,
      });
    }

    res.status(200).json({
      data: {
        resumeId: savedResume._id,
        outreachResults: fullOutreachResults,
      },
    });
  } catch (err) {
    console.error(err);
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
    
    // ✅ Convert structured data → semantic natural language (BETTER embeddings)
    const skillString = updatedData.skills.join(", ");
    const expString = updatedData.experience
      .map(exp => `${exp.role || 'Professional'} at ${exp.company || 'Company'}`)
      .join(". ");
    
    const textToEmbed = `Software and Tech Professional. Skills include: ${skillString}. Experience includes: ${expString}.`;
    
    // ✅ Use query mode for better search alignment
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

    // ✅ RAG sync (correct way)
    console.log("🔄 Rebuilding RAG chunks for updated resume...");

    await qdrantClient.delete("resume_chunks", {
      wait: true,
      filter: {
        must: [
          { key: "resumeId", match: { value: String(resumeId) } }
        ]
      }
    });

    const fullText = JSON.stringify(updatedData); // better if you store original resume text
    await processResumeRAG(resumeId, fullText);

    console.log("✅ Resume successfully updated in MongoDB + Qdrant!");

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
  try {
    const { resumeId } = req.body;
    const savedResume = await Resume.findById(resumeId);
    if (!savedResume) return res.status(404).json({ error: "Resume not found" });
    
    // You can safely change this number to 5 or 10 if you want to show more roles in the manual UI!
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 10);
    res.status(200).json({ data: matchedRoles });
  } catch (err) {
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