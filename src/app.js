require("dotenv").config();
const express = require("express");
const cors = require("cors");
const config = require("./config/config");
const db = require("./config/db");
const authRoutes = require("./routes/auth.routes");

(async () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  await db.connect();
  app.use("/api/auth", authRoutes.build());
  app.use((err, req, res, next) => {
    console.log(err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  });

  const port = config.port;
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
})();
