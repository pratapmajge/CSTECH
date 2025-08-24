import express from "express";
import multer from "multer";
import csv from "csvtojson";
import List from "../models/List.js";

const router = express.Router();

// Multer setup (temporary storage)
const upload = multer({ dest: "uploads/" });

// 📌 Upload and Save List
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Convert CSV → JSON
    const jsonArray = await csv().fromFile(req.file.path);

    // Save to DB
    const newList = new List({
      name: req.file.originalname, // filename as list name
      data: jsonArray,
      uploadedBy: req.user?._id || null, // we’ll add auth later
    });

    await newList.save();

    res.json({
      message: "List uploaded and saved successfully",
      list: newList,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Get all lists
router.get("/", async (req, res) => {
  try {
    const lists = await List.find().sort({ createdAt: -1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
