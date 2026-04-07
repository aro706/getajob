import mongoose from "mongoose";

// Schema for the experience array
const experienceSchema = new mongoose.Schema({
  company: String,
  role: String,
  duration: String,
  description: String
});

// Main Schema for the User's Resume
const resumeSchema = new mongoose.Schema({
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: [experienceSchema],
    default: []
  },
  embedding: { 
    type: [Number], // The 768-number array from Gemini
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;