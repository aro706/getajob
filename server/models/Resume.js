import mongoose from "mongoose";

// Schema for the experience array
const experienceSchema = new mongoose.Schema({
  company: String,
  role: String,
  duration: String,
  description: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Resume", resumeSchema);
