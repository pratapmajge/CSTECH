// backend/routes/agentRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ============================
 * Create Agent (Admin Only)
 * ============================
 */
router.post("/create", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Agent already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "agent",
    });

    await agent.save();
    res.status(201).json({
      message: "Agent created successfully",
      agent: { id: agent._id, name: agent.name, email: agent.email, role: agent.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ============================
 * Get All Agents (Admin Only)
 * ============================
 */
router.get("/", authMiddleware(["admin"]), async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" }).select("-password");
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ============================
 * Delete Agent (Admin Only)
 * ============================
 */
router.delete("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const agent = await User.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ message: "Agent deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
