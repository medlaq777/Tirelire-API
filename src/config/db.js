const mongoose = require("mongoose");
const config = require("./config");

let instance = null;

const connectDB = async () => {
  if (instance) return instance;
  instance = await mongoose.connect(config.mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("OK");
  return instance;
};
