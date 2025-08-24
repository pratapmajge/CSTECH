import express from "express";
import Assignment from "../models/Assignment.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * ============================
 * Get All Assignments for Logged-in Agent
 * ============================
 */
router.get("/me", authMiddleware(["agent"]), async (req, res) => {
  try {
    const assignments = await Assignment.find({ agentId: req.user.id })
      .populate("listId", "name") // so you can show list name in frontend
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
