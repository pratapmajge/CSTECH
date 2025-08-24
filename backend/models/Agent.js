// backend/models/Agent.js
import mongoose from "mongoose";

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "agent" },
}, { timestamps: true });

export default mongoose.model("Agent", agentSchema);
