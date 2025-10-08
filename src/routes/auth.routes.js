import express from "express";
import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

class AuthRoutes {
  static build() {
    const router = express.Router();
    router.post("/register", authController.register.bind(authController));
    router.post("/login", authController.login.bind(authController));
    router.get(
      "/profile",
      authMiddleware.protect,
      authController.profile.bind(authController)
    );
    return router;
  }
}

export default AuthRoutes;
