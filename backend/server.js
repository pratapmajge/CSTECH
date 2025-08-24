import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import agentRoutes from "./routes/agentRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import authRoutes from "./routes/authRoutes.js";  // ✅ Add this
import assignmentRoutes from "./routes/assignmentRoutes.js";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);    // ✅ Add Auth routes
app.use("/api/agents", agentRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/assignments", assignmentRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
