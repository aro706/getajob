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

export const triggerPipeline = async (req, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) return res.status(400).json({ error: "Resume ID is required" });

    const savedResume = await Resume.findById(resumeId);
    if (!savedResume) return res.status(404).json({ error: "Resume not found" });

    // Keeping this at 3 for the automated pipeline so it doesn't take 10 minutes to draft emails!
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);
    const fullOutreachResults = [];

    for (const match of matchedRoles) {
      const contacts = await runOutreachPipeline(match.title);
      const enrichedContacts = [];

      for (const hr of contacts) {
        let aiDrafts = null;
        if (hr.name && hr.company) {
           try {
             aiDrafts = await generateEmailDrafts(savedResume, hr.company, match.title, hr.name);
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

      fullOutreachResults.push({
        targetRole: match.title,
        matchPercentage: match.matchPercentage,
        totalFound: contacts.length,
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