const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

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

module.exports = AuthRoutes;
