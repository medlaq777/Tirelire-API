import express from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Kyc from "../middlewares/kyc.middleware.js";
import GroupController from "../controllers/group.controller.js";

class GroupRoutes {
  static build() {
    const router = express.Router();

    router.post(
      "/group",
      AuthMiddleware.protect,
      Kyc.requireKyc,
      GroupController.join.bind(GroupController)
    );
    router.post(
      "/:groupId/join",
      AuthMiddleware.protect,
      Kyc.requireKyc,
      GroupController.join.bind(GroupController)
    );
    router.get(
      "/group",
      AuthMiddleware.protect,
      GroupController.list.bind(GroupController)
    );

    return router;
  }
}

export default GroupRoutes;
