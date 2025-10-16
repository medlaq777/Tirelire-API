import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.ObjectId, ref: "Group", required: true },
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "resolved", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
