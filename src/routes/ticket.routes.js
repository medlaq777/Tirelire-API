import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import TicketController from "../controllers/ticket.controller.js";

class TicketRoutes {
  static build() {
    const router = express.Router();

    router.post(
      "/tickets",
      AuthMiddleware.protect,
      TicketController.create.bind(TicketController)
    );
    router.get(
      "/tickets",
      AuthMiddleware.protect,
      TicketController.listUser.bind(TicketController)
    );

    router.get(
      "/tickets/all",
      AuthMiddleware.protect,
      AuthMiddleware.authorizeRole("admin"),
      TicketController.listAll.bind(TicketController)
    );

    router.put(
      "/tickets/status",
      AuthMiddleware.protect,
      AuthMiddleware.authorizeRole("admin"),
      TicketController.resolve.bind(TicketController)
    );

    return router;
  }
}

export default TicketRoutes;
