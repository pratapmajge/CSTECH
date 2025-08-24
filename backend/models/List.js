import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Leads List - Aug"
    data: { type: Array, required: true }, // Store CSV rows as JSON
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin user reference
  },
  { timestamps: true }
);

const List = mongoose.model("List", listSchema);

export default List;
