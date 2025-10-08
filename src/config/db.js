import mongoose from "mongoose";
import config from "./config.js";

class database {
  constructor() {
    this.connected = false;
  }
  async connect() {
    if (this.connected) return;
    if (!config.mongoUri) throw new Error("MongoDB URI not provided in config");
    try {
      await mongoose.connect(config.mongoUri);
      this.connected = true;
      console.log("MongoDB connected");
    } catch (err) {
      console.error("mongoDB connection error:", err);
      throw err;
    }
  }
}

export default new database();
