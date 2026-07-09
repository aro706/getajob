import mongoose from "mongoose";

// Schema for the experience array
const experienceSchema = new mongoose.Schema({
  company: String,
  role: String,
  duration: String,
  description: String,
});

// Schema for tracking email drafts and outreach status
const outreachAttemptSchema = new mongoose.Schema({
  companyName: String,
  roleTitle: String,
  hrName: String,
  hrEmail: String,
  drafts: {
    professional: String,
    bold: String,
    concise: String
  },
  status: {
    type: String,
    enum: ['draft', 'sent'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Main Schema for the User's Resume
const resumeSchema = new mongoose.Schema({
  skills: {
    type: [String],
    default: [],
  },
  experience: {
    type: [experienceSchema],
    default: [],
  },
  embedding: {
    type: [Number], 
    required: true,
  },
  outreachAttempts: {
    type: [outreachAttemptSchema],
    default: []
  },
  // OPTIMIZATION: Unique cryptographic hash of the raw uploaded file buffer
  fileHash: {
    type: String,
    unique: true, // Guarantees database constraint protection against duplicate vector rendering
    sparse: true  // Allows old records lacking a hash signature to coexist cleanly without indexing errors
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Resume", resumeSchema);