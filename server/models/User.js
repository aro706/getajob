import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['aspirant', 'recruiter'], default: 'aspirant' },
  createdAt: { type: Date, default: Date.now }
});

// Hash the password before saving to the database
userSchema.pre("save", async function () {
  // If the password wasn't modified, just return immediately
  if (!this.isModified("password")) {
    return; 
  }
  
  // Otherwise, hash the new password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify passwords during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);