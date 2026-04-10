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
    type: [Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Role = mongoose.model("Role", roleSchema);
export default Role;