import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.ObjectId, ref: "Group", required: true },
  member: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  stripePaymentId: { type: String },
  status: {
    type: String,
    enum: ["pending", "succeeded", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);
