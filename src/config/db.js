import mongoose from "mongoose";
import Config from "./config.js";

class Database {
  constructor() {
    this.connected = false;
  }
  async connect() {
    if (this.connected) return;
    if (!Config.mongoUri) throw new Error("MongoDB URI not provided in config");
    try {
      await mongoose.connect(Config.mongoUri);
      this.connected = true;
      console.log("MongoDB connected");
    } catch (err) {
      console.error("mongoDB connection error:", err);
      throw err;
    }
  }
}

export default new Database();
