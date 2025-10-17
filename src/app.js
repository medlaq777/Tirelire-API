import "dotenv/config";
import express from "express";
import cors from "cors";
import Config from "./config/config.js";
import db from "./config/db.js";
import AuthRoutes from "./routes/auth.routes.js";
import KycRoutes from "./routes/kyc.routes.js";
import GroupRoutes from "./routes/group.routes.js";
import PaymentRoutes from "./routes/payment.routes.js";
import TicketRoutes from "./routes/ticket.routes.js";
import ContributionRoutes from "./routes/contribution.routes.js";

const app = express();
app.use(cors());
app.use("/api/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
await db.connect();
app.use("/api", AuthRoutes.build());
app.use("/api", KycRoutes.build());
app.use("/api", GroupRoutes.build());
app.use("/api", PaymentRoutes.build());
app.use("/api", TicketRoutes.build());
app.use("/api", ContributionRoutes.build());
app.use((err, res) => {
  console.log(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message });
});

const port = Config.port;
app.listen(port, () =>
  console.log(`🚀 Server running on port http://localhost:${port}`)
);
