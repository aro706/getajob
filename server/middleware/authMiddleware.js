import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // Check if the authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract the token (Format: "Bearer <token>")
      token = req.headers.authorization.split(" ")[1];

      // Verify token using the secret key
      const secret = process.env.JWT_SECRET || "your_super_secret_jwt_key_here";
      const decoded = jwt.verify(token, secret);

      // Fetch the user from the database and attach to the request object
      // We use .select('-password') to ensure the hashed password isn't passed along
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ error: "Not authorized, no token provided" });
  }
};