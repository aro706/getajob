import { getHiringCompanies, searchBatch, extractHR, chunk } from "./discoveryService.js";
import { findEmail } from "./enrichmentService.js";

// This function takes a single role string, runs the whole pipeline, and returns the contacts
export async function runOutreachPipeline(roleTitle) {
  console.log(`\n--- STARTING DEEP SEARCH FOR: ${roleTitle} ---`);
  
  try {
    // 1. Get Companies
    const companies = await getHiringCompanies(roleTitle);
    if (!companies || companies.length === 0) {
      console.log(`No companies found for ${roleTitle}`);
      return [];
    }
    console.log(`Found ${companies.length} companies for ${roleTitle}`);

    // 2. LinkedIn Search
    const groups = chunk(companies, 5);
    let allResults = [];
    for (const group of groups) {
      const batchRes = await searchBatch(group);
      allResults = allResults.concat(batchRes);
    }

    // 3. Extract HRs
    const hrList = await extractHR(allResults);
    
    // 4. Enrich Emails
    const finalContacts = [];
    for (const person of hrList) {
      if (person.name && person.company) {
        const emailData = await findEmail(person.name, person.company);
        finalContacts.push({
          name: person.name,
          role: person.role,
          company: person.company,
          linkedin: person.linkedin,
          email: emailData.email,
          source: emailData.source
        });
      }
    }

    return finalContacts;

  } catch (error) {
    console.error(`Error in pipeline for ${roleTitle}:`, error.message);
    return [];
  }
}