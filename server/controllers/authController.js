import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Helper function to generate a JWT
const generateToken = (id) => {
  // Make sure to add JWT_SECRET to your .env file!
  const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_here";
  return jwt.sign({ id }, secret, { expiresIn: "30d" });
};

export const registerUser = async (req, res) => {
  try {
    console.log("===== REGISTER API HIT =====");
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Create the user
    const user = await User.create({ name, email, password, role });

    if (user) {
      res.status(201).json({
        message: "User registered successfully",
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", email);

    const user = await User.findOne({ email });


    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isMatch = await user.matchPassword(password);

    console.log("Password Match:", isMatch);

    if (isMatch) {
      res.status(200).json({
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: "Incorrect password" });
    }
  } catch (err) {
    console.error(err);
  }
};