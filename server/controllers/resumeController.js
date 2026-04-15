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

    const updatedData = { skills: skills || [], experience: experience || [], projects: projects || [] };
    const textToEmbed = JSON.stringify(updatedData);
    const newEmbedding = Array.from(await generateEmbedding(textToEmbed));

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

    // 🛑 This is the section that was accidentally deleted!
    res.status(200).json({ data: updatedResume });
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
    
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);
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