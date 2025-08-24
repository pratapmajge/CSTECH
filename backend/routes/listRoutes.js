import express from "express";
import multer from "multer";
import csv from "csvtojson";
import List from "../models/List.js";
import User from "../models/User.js";
import Assignment from "../models/Assignment.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer setup (store in memory, not disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * ============================
 * Upload CSV and Create List (Admin Only)
 * ============================
 */
router.post(
  "/upload",
  authMiddleware(["admin"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required" });
      }

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "List name is required" });
      }

      // Convert buffer -> string -> JSON
      const csvString = req.file.buffer.toString("utf-8");
      const jsonArray = await csv().fromString(csvString);

      if (!jsonArray.length) {
        return res.status(400).json({ message: "CSV is empty" });
      }

      // ✅ Check agents BEFORE saving list
      const agents = await User.find({ role: "agent" });
      if (agents.length < 5) {
        return res.status(400).json({ message: "At least 5 agents are required" });
      }

      // Save list
      const newList = new List({
        name,
        data: jsonArray,
        uploadedBy: req.user.id,
      });
      await newList.save();

      // Distribute items among ALL available agents (round robin)
      let assignments = [];
      jsonArray.forEach((row, index) => {
        const agent = agents[index % agents.length]; // ✅ use all agents, not just first 5
        assignments.push({
          listId: newList._id,
          agentId: agent._id,
          record: {
            firstName: row.FirstName || row.first_name || row.firstName || "",
            phone: row.Phone || row.phone || "",
            notes: row.Notes || row.notes || "",
          },
        });
      });

      await Assignment.insertMany(assignments);

      res.status(201).json({
        message: "List uploaded & distributed successfully",
        list: { id: newList._id, name: newList.name, count: jsonArray.length },
        assignmentsCount: assignments.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

/**
 * ============================
 * Get All Lists (Admin Only)
 * ============================
 */
router.get("/", authMiddleware(["admin"]), async (req, res) => {
  try {
    const lists = await List.find()
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ============================
 * Get Single List (Admin + Agent)
 * ============================
 */
router.get("/:id", authMiddleware(["admin", "agent"]), async (req, res) => {
  try {
    const list = await List.findById(req.params.id).populate("uploadedBy", "name email");
    if (!list) return res.status(404).json({ message: "List not found" });

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ============================
 * Get Assignments of a List
 * ============================
 */
router.get("/:id/assignments", authMiddleware(["admin", "agent"]), async (req, res) => {
  try {
    const filter = { listId: req.params.id };
    if (req.user.role === "agent") {
      filter.agentId = req.user.id; // agent only sees their own
    }

    const assignments = await Assignment.find(filter)
      .populate("agentId", "name email")
      .sort({ createdAt: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * ============================
 * Delete List (Admin Only)
 * ============================
 */
router.delete("/:id", authMiddleware(["admin"]), async (req, res) => {
  try {
    const list = await List.findByIdAndDelete(req.params.id);
    if (!list) return res.status(404).json({ message: "List not found" });

    // also remove related assignments
    await Assignment.deleteMany({ listId: req.params.id });

    res.json({ message: "List & assignments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
