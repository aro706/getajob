import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  hrName: { type: String, required: true },
  hrEmail: { type: String, required: true, unique: true },
  role: { type: String }, // e.g., "Senior Recruiter"
  linkedin: { type: String },
  source: { type: String, default: "hunter.io" },
  verified: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now }
});

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  domain: { type: String },
  location: { type: String },
  industry: { type: String },
  contacts: [contactSchema] // Array of known HRs for this company
}, { timestamps: true });

const Company = mongoose.model("Company", companySchema);
export default Company;