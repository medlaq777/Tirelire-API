const mongoose = require("mongoose");
const config = require("./config");

class database {
  constructor() {
    this.connect = false;
  }
  async connectDB() {
    if (this.connect) return;
    if (!config.mongoUri) throw new Error("MongoDB URI not provided in config");
    try {
      await mongoose.connect(config.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      this.connect = true;
      console.log("OK");
    } catch (err) {
      console.error("mongoDB connection error:", err);
      throw err;
    }
  }
}

module.exports = new database();
