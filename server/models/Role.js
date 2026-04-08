import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // 768-dim array from Gemini
    required: true,
  },
  // The pre-calculated ranklist bucket!
  rankedResumes: [
    {
      resumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
      score: { type: Number, required: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  embedding: { 
    type: [Number],
    required: true 
  } 
});

// Create and export the model
const Role = mongoose.model("Role", roleSchema);
export default Role;
