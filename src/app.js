import "dotenv/config";
import express from "express";
import cors from "cors";
import config from "./config/config.js";
import db from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

(async () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  await db.connect();
  app.use("/api", authRoutes.build());
  app.use((err, req, res, next) => {
    console.log(err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  });

  const port = config.port;
  app.listen(port, () =>
    console.log(`🚀 Server running on port http://localhost:${port}`)
  );
})();
