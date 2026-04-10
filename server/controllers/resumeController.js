import resumeService from "../services/resumeService.js";
import { findTopMatchingRoles } from "../services/matchService.js";
import { runOutreachPipeline } from "../services/outreachService.js";
import { generateEmailDrafts } from "../services/emailAgentService.js"; // Ensure path is correct
import { sendMail } from "../services/mailTransporter.js"; // Ensure path is correct

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("\n================================================");
    console.log("1. Extracting, embedding, and saving resume...")
    const savedResume = await resumeService(req.file);

    console.log("2. Finding top matching roles...");
    const matchedRoles = await findTopMatchingRoles(savedResume.embedding, 3);

    console.log("3. Initiating Deep Search & AI Outreach...");

    const fullOutreachResults = [];

    for (const match of matchedRoles) {
      console.log(`\n>> Target Role: ${match.title}`);
      
      // A. Find the HR contacts (Max 2 per company via your logic)
      const contacts = await runOutreachPipeline(match.title);
      const enrichedContacts = [];

      for (const hr of contacts) {
        let aiDrafts = null;
        let emailSentStatus = false;

        // B. Generate the AI Email Drafts
        if (hr.name && hr.company) {
           console.log(`   ✍️ Gemini is drafting emails for ${hr.name}...`);
           try {
             aiDrafts = await generateEmailDrafts(savedResume, hr.company, match.title, hr.name);
           } catch (draftError) {
             console.log(`   ⚠️ Draft failed for ${hr.name}: ${draftError.message}`);
           }
        }

        // C. Send the Email (The Live Ammunition)
        // We only try to send if we have a real email (not a dummy example.com) and the draft succeeded
        if (hr.email && hr.email !== "Unknown" && !hr.email.includes("example.com") && aiDrafts) {
            const subjectLine = `Application for ${match.title} role - Experienced Candidate`;
            
            console.log(`   🚀 Preparing to send email to ${hr.email}...`);
            
            // =================================================================
            // 🛑 SAFETY CATCH: UNCOMMENT THE TWO LINES BELOW TO ACTUALLY SEND!
            // =================================================================
            // await sendMail(hr.email, subjectLine, aiDrafts.professional);
            // emailSentStatus = true;
        }

        // Add everything to our final response object
        enrichedContacts.push({
          name: hr.name,
          role: hr.role,
          company: hr.company,
          linkedin: hr.linkedin,
          email: hr.email,
          source: hr.source,
          drafts: aiDrafts,       // The 3 variations from Gemini
          emailSent: emailSentStatus
        });
      }

      fullOutreachResults.push({
        targetRole: match.title,
        matchPercentage: match.matchPercentage,
        totalFound: contacts.length,
        hrContacts: enrichedContacts,
      });
    }

    console.log("\n4. GOD MODE COMPLETE!");
    console.log("================================================");

    res.json({
      message: "Ultimate Pipeline Complete!",
      data: {
        resumeId: savedResume._id,
        parsedResume: {
          skills: savedResume.skills,
          experience: savedResume.experience,
        },
        outreachResults: fullOutreachResults,
      },
    });
  } catch (err) {
    console.error("Resume Controller Error:", err);
    res.status(500).json({ error: "Ultimate Processing failed" });
  }
};

export default uploadResume;