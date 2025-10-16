import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.ObjectId, ref: "Group", required: true },
  member: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  stripePaymentId: { type: string },
  status: {
    type: string,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);
