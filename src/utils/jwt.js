const jwt = require("jsonwebtoken");
const config = require("../config/config");

class jwtUtils {
  static generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  static verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
  }
}
module.exports = jwtUtils;
