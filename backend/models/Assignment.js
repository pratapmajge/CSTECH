import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    listId: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    record: {
      firstName: String,
      email: String,
      phone: String,
      notes: String,
    },
  },
  { timestamps: true }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
