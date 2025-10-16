import express from "express";
import KycController from "../controllers/kyc.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

class KycRoutes {
  static build() {
    const r = express.Router();
    r.post(
      "/kyc/submit",
      AuthMiddleware.protect,
      upload.fields([
        { name: "idImage", maxCount: 1 },
        { name: "selfie", maxCount: 1 },
      ]),
      KycController.submit.bind(KycController)
    );

    r.post(
      "/approve",
      AuthMiddleware.protect,
      AuthMiddleware.authorizeRole("admin"),
      KycController.adminApprove.bind(KycController)
    );
    return r;
  }
}
export default KycRoutes;
