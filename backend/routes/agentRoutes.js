// backend/routes/agentRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin creates agent
router.post("/create", authMiddleware(["admin"]), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Agent already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = new User({
      name,
      email,
      password: hashedPassword,
      role: "agent",
    });

    await agent.save();
    res.status(201).json({ message: "Agent created successfully", agent });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all agents (admin only)
router.get("/", authMiddleware(["admin"]), async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" }).select("-password");
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an agent (admin only)
router.delete("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const agent = await User.findByIdAndDelete(req.params.id);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    res.json({ message: "Agent deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
