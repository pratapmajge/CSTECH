// backend/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Generate JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// =================== REGISTER (Only for First Admin) ===================
router.post("/register", async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if an Admin already exists
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res.status(403).json({
        message: "Public registration disabled. Only Admin can add users.",
      });
    }

    // First user must be Admin
    if (role !== "admin") {
      return res
        .status(400)
        .json({ message: "First registered user must be an Admin." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "admin",
    });

    await user.save();

    res.status(201).json({
      message: "Initial Admin registered successfully",
      user: { id: user._id, name: user.name, role: user.role, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =================== LOGIN ===================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, role: user.role, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// =================== GET PROFILE ===================
router.get("/profile", authMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
