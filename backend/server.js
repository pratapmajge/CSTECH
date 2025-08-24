import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import agentRoutes from "./routes/agentRoutes.js";
import listRoutes from "./routes/listRoutes.js";



dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/agents", agentRoutes);

app.use("/api/lists", listRoutes);


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
