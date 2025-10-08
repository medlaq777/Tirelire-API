const authService = require("..services/auth.service");

class AuthController {
  constructor(service) {
    this.service = service;
  }

  async register(req, res, next) {
    try {
      const payload = req.body;
      const result = await this.service.register(payload);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const payload = req.body;
      const result = await this.service.login(payload);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async profile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await this.service.profile(userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
}
module.exports = new AuthController(authService);
