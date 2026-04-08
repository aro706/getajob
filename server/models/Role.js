import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  embedding: { 
    type: [Number],
    required: true 
  } 
});

// Create and export the model using ES Modules
const Role = mongoose.model("Role", roleSchema);
export default Role;