import mongoose from "mongoose";

const learningResourceSchema = new mongoose.Schema({
  goal: { type: String, required: true },
  content: { type: String, required: true },
  url: { type: String },
  // 768 dimensions for Gemini embeddings
  embedding: { type: [Number], required: true } 
});

const LearningResource = mongoose.model("LearningResource", learningResourceSchema);
export default LearningResource;