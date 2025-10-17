import jwt from "jsonwebtoken";
import config from "../config/config.js";

class JwtUtils {
  static generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  }

  static verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
  }
}
export default JwtUtils;
