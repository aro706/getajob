import Resume from "../models/Resume.js";
import { generateEmailDrafts } from "../services/emailAgentService.js";
import { sendMail } from "../services/mailTransporter.js"; 
import { runOutreachPipeline } from "../services/outreachService.js";
import { findEmail } from "../services/enrichmentService.js";

// Existing Function: Finds the jobs and HR contacts
export const discoverJobsAndHR = async (req, res) => {
  try {
    const { roleTitle } = req.body;
    if (!roleTitle) return res.status(400).json({ error: "Role title is required" });

    const contacts = await runOutreachPipeline(roleTitle);
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW Function: Generates the 3 AI Email Drafts
export const generateDraft = async (req, res) => {
  try {
    const { resumeId, companyName, roleTitle, hrName, hrEmail } = req.body;

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    // 1. Generate the 3 variations using Gemini
    const drafts = await generateEmailDrafts(resume, companyName, roleTitle, hrName);

    // 2. Save to database as a pending draft
    const newAttempt = {
      companyName,
      roleTitle,
      hrName,
      hrEmail,
      drafts,
      status: 'draft'
    };
    
    resume.outreachAttempts.push(newAttempt);
    await resume.save();

    // Return the newly created attempt
    const savedAttempt = resume.outreachAttempts[resume.outreachAttempts.length - 1];

    res.status(200).json({ 
      success: true,
      message: "Drafts generated successfully", 
      attemptId: savedAttempt._id,
      drafts 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW Function: Sends the chosen draft to the HR
export const sendEmail = async (req, res) => {
  try {
    const { resumeId, attemptId, selectedDraftText } = req.body;

    const resume = await Resume.findById(resumeId);
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    const attempt = resume.outreachAttempts.id(attemptId);
    if (!attempt) return res.status(404).json({ error: "Draft not found" });

    // Send the email using NodeMailer
    const subject = `Application for ${attempt.roleTitle} - Software Engineer`;
    await sendMail(attempt.hrEmail, subject, selectedDraftText);

    // Mark as sent in DB
    attempt.status = 'sent';
    await resume.save();

    res.status(200).json({ success: true, message: "Email sent successfully!" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchHRContact = async (req, res) => {
  try {
    const { hrName, companyName } = req.body;

    if (!hrName || !companyName) {
      return res.status(400).json({ error: "Missing hrName or companyName" });
    }

    // This calls the service we updated with the MongoDB cache check
    const result = await findEmail(hrName, companyName);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Search HR Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};