import express from "express";
import multer from "multer";
import path from "path";
import csv from "csvtojson";
import xlsx from "xlsx";
import List from "../models/List.js";
import User from "../models/User.js";
import Assignment from "../models/Assignment.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer setup (store in memory, not disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Allowed extensions
const allowedExtensions = [".csv", ".xlsx", ".xls"];

/**
 * ============================
 * Upload File (CSV/XLSX/XLS) and Create List (Admin Only)
 * ============================
 */
router.post(
  "/upload",
  authMiddleware(["admin"]),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return res
          .status(400)
          .json({ message: "Invalid file format. Only CSV, XLSX, XLS allowed" });
      }

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "List name is required" });
      }

      let jsonArray = [];

      // Parse file depending on extension
      if (ext === ".csv") {
        const csvString = req.file.buffer.toString("utf-8");
        jsonArray = await csv().fromString(csvString);
      } else {
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonArray = xlsx.utils.sheet_to_json(worksheet);
      }

      if (!jsonArray.length) {
        return res.status(400).json({ message: "File is empty or invalid" });
      }

      // ✅ Check required fields
      const requiredFields = ["FirstName", "Phone", "Notes"];
      const missingFields = requiredFields.filter(
        (f) => !Object.keys(jsonArray[0]).includes(f)
      );
      if (missingFields.length > 0) {
        return res
          .status(400)
          .json({ message: `Missing required fields: ${missingFields.join(", ")}` });
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
        const agent = agents[index % agents.length];
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
        message: "File uploaded, validated & distributed successfully",
        list: { id: newList._id, name: newList.name, count: jsonArray.length },
        assignmentsCount: assignments.length,
      });
    } catch (error) {
      console.error("Upload error:", error);
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

    await Assignment.deleteMany({ listId: req.params.id });

    res.json({ message: "List & assignments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
