import "dotenv/config";
import express from "express";
import cors from "cors";
import config from "./config/config.js";
import db from "./config/db.js";
import auth from "./routes/auth.routes.js";
import kyc from "./routes/kyc.routes.js";
import group from "./routes/group.routes.js";

(async () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  await db.connect();
  app.use("/api", auth.build());
  app.use("/api/kyc", kyc.build());
  app.use("/api/group", group.build());
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
