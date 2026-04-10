import { getHiringCompanies, searchBatch, extractHR, chunk } from "./discoveryService.js";
import { findEmail } from "./enrichmentService.js"; 

/**
 * Main pipeline to discover companies, find HR contacts, and enrich with emails.
 */
export async function runOutreachPipeline(roleTitle) {
  console.log(`\n--- STARTING DEEP SEARCH FOR: ${roleTitle} ---`);
  
  try {
    // STEP 1: Discover companies hiring for the role
    const companies = await getHiringCompanies(roleTitle);
    if (!companies || companies.length === 0) return [];

    // STEP 2: Batch search for potential HR/Recruiter contacts
    const groups = chunk(companies, 5);
    let allResults = [];
    for (const group of groups) {
      const batchRes = await searchBatch(group);
      allResults = allResults.concat(batchRes);
    }

    // STEP 3: Extract structured HR data from search results
    const hrList = await extractHR(allResults);
    
    // ---------------------------------------------------------
    // SMART ENRICHMENT ALGORITHM (Strict Quality Control)
    // ---------------------------------------------------------
    const finalContacts = [];
    const hrByCompany = {};

    // Group all found HRs by company to ensure diversity in outreach
    for (const person of hrList) {
      if (person.name && person.company) {
        if (!hrByCompany[person.company]) hrByCompany[person.company] = [];
        hrByCompany[person.company].push(person);
      }
    }

    for (const companyName in hrByCompany) {
      const employees = hrByCompany[companyName];
      let verifiedCount = 0;
      let generatedContacts = [];

      for (const person of employees) {
        // Optimization: Stop after 2 high-quality contacts per company to save API credits
        if (verifiedCount >= 2) break; 

        // findEmail now checks the centralized Company model first
        const emailData = await findEmail(person.name, person.company);
        console.log(`${person.name} (${person.company}) -> ${emailData.email} [${emailData.source}]`);
        
        const contactRecord = {
          name: person.name,
          role: person.role,
          company: person.company,
          linkedin: person.linkedin,
          email: emailData.email,
          source: emailData.source
        };

        // --- UPDATED VERIFICATION LOGIC ---
        // 'company_database' = Found in our centralized Company cache.
        // 'hunter.io' = Verified in real-time by the external API.
        if (emailData.source === 'hunter.io' || emailData.source === 'company_database') {
          finalContacts.push(contactRecord);
          verifiedCount++;
        } else {
          // Keep track of pattern-predicted (unverified) emails as backups
          generatedContacts.push(contactRecord);
        }
      }

      // THE STRICT RULE:
      // If we didn't find at least 2 verified/cached emails, use ONE generated email to pad the list.
      // This ensures we never send more than one "guessed" email per company.
      if (verifiedCount < 2 && generatedContacts.length > 0) {
        finalContacts.push(generatedContacts[0]);
      }
    }

    return finalContacts;

  } catch (error) {
    console.error(`Error in pipeline for ${roleTitle}:`, error.message);
    return [];
  }
}