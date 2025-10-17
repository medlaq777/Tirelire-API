import express from "express";

import AuthMiddleware from "../middlewares/auth.middleware.js";
import KycMiddleware from "../middlewares/kyc.middleware.js";

import ContributionController from "../controllers/contribution.controller.js";

class ContributionRoutes {
  static build() {
    const router = express.Router();

    router.post(
      "/init",
      AuthMiddleware.protect,
      KycMiddleware.requireKyc,
      ContributionController.initRounds.bind(ContributionController)
    );
    router.post(
      "/complete",
      AuthMiddleware.protect,
      ContributionController.completeRound.bind(ContributionController)
    );

    router.get(
      "/round",
      AuthMiddleware.protect,
      ContributionController.list.bind(ContributionController)
    );

    return router;
  }
}

export default ContributionRoutes;
