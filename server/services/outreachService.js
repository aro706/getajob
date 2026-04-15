import { getHiringCompanies, searchBatch, extractHR, chunk } from "./discoveryService.js";
import { findEmail } from "./enrichmentService.js"; 

export async function runOutreachPipeline(roleTitle) {
  console.log(`\n--- STARTING DEEP SEARCH FOR: ${roleTitle} ---`);
  
  try {
    const companies = await getHiringCompanies(roleTitle);
    if (!companies || companies.length === 0) return [];

    const groups = chunk(companies, 5);
    let allResults = [];
    for (const group of groups) {
      const batchRes = await searchBatch(group);
      allResults = allResults.concat(batchRes);
    }

    const hrList = await extractHR(allResults);
    
    const finalContacts = [];
    const hrByCompany = {};

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
        if (verifiedCount >= 2) break; 

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

        if (emailData.source === 'hunter.io' || emailData.source === 'company_database') {
          finalContacts.push(contactRecord);
          verifiedCount++;
        } else {
          generatedContacts.push(contactRecord);
        }
      }

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

export async function processSelectedCompanies(companies) {
  console.log(`\n--- STARTING MANUAL OUTREACH FOR SELECTED COMPANIES ---`);
  
  try {
    if (!companies || companies.length === 0) return [];

    const groups = chunk(companies, 5);
    let allResults = [];
    for (const group of groups) {
      const batchRes = await searchBatch(group);
      allResults = allResults.concat(batchRes);
    }

    const hrList = await extractHR(allResults);
    
    const finalContacts = [];
    const hrByCompany = {};

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
        if (verifiedCount >= 2) break; 

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

        if (emailData.source === 'hunter.io' || emailData.source === 'company_database') {
          finalContacts.push(contactRecord);
          verifiedCount++;
        } else {
          generatedContacts.push(contactRecord);
        }
      }

      if (verifiedCount < 2 && generatedContacts.length > 0) {
        finalContacts.push(generatedContacts[0]);
      }
    }

    return finalContacts;

  } catch (error) {
    console.error(`Error in manual pipeline:`, error.message);
    return [];
  }
}