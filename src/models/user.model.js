import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 6 },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isKycVerified: { type: Boolean, default: false },
    reliabilityScore: { type: Number, default: 100 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
