import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import KycMiddleware from "../middlewares/kyc.middleware.js";
import GroupController from "../controllers/group.controller.js";

const router = express.Router();

class GroupRoutes {
  static build() {
    const router = express.Router();

    router.post(
      "/group",
      AuthMiddleware.protect(),
      KycMiddleware.requireKyc(),
      GroupController.join.bind(GroupController)
    );
    router.post(
      "/:groupId/join",
      AuthMiddleware.protect(),
      KycMiddleware.requireKyc(),
      GroupController.join.bind(GroupController)
    );
    router.get(
      "/group",
      AuthMiddleware.protect(),
      GroupController.list.bind(GroupController)
    );
  }
}

export default GroupRoutes;
