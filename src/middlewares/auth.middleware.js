const jwt = require("jsonwebtoken");
class AuthMiddleware {
  static protect(req, res, next) {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith("Bearer ")) {
        const err = new Error("Unauthorized");
        err.status = 401;
        throw err;
      }
      const token = header.split(" ")[1];
      const payload = jwt.verify(token);
      req.user = payload;
      next();
    } catch (err) {
      next(err);
    }
  }
}
module.exports = AuthMiddleware;
