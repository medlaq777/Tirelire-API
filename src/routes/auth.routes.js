const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.get(
  "/profile",
  authMiddleware,
  authController.profile.bind(authController)
);

module.exports = router;
