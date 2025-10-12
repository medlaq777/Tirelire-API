import mongoose from "mongoose";

const keySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    fullname: { type: String, required: true },
    // nationalId: { type: String, required: true },
    nationalId: { type: String, required: true },
    idImageMeta: {
      filename: String,
      iv: String,
      authTag: String,
      path: String,
    },
    selfieMeta: {
      filename: String,
      iv: String,
      authTag: String,
      path: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verification: {
      method: { type: String, enum: ["auto", "manual", null], default: null },
      score: Number,
      note: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("kycDocument", keySchema);
