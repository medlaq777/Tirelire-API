import express from "express";
import KycController from "../controllers/kyc.controller";
import AuthMiddleware from "../middlewares/auth.middleware";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

class KycRoutes {
  static build() {
    const r = express.Router();
    r.post(
      "/submit",
      AuthMiddleware.protect,
      upload.fields([
        { name: "idImage", maxCount: 1 },
        { name: "selfie", maxCount: 1 },
      ]),
      KycController.submit.bind(KycController)
    );

    r.post(
      "/:kycId/approve",
      AuthMiddleware.protect,
      AuthMiddleware.authorizeRole("admin"),
      KycController.adminApprove.bind(KycController)
    );
    return r;
  }
}
module.exports = KycRoutes;
