const bycrypt = require("bcryptjs");
const userRepo = require("../repositories/user.repository");
const jwt = require("../utils/jwt");
const config = require("../config/config");

class AuthService {
  constructor(userRepo) {
    this.userRepo = userRepo;
  }
  async register({ email, password }) {
    if (!email || !password) {
      const err = new Error("Email and Password are required");
      err.status = 400;
      throw err;
    }
    const userExists = await this.userRepo.findByEmail(email);
    if (userExists) {
      const err = new Error("User already exists");
      err.status = 409;
      throw err;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.userRepo.create({ email, password: hashed });
    const token = jwt.generateToken({ id: user.id, email: user.email });
    return { user: this.sanitize(user), token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      const err = new Error("Email and Password are required");
      err.status = 400;
      throw err;
    }
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }
    const isSame = await bcrypt.compare(password, user.password);
    if (!isSame) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }
    const token = jwt.generateToken({ id: user.id, email: user.email });
    return { user: this.sanitize(user), token };
  }

  async profile(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    return this.sanitize(user);
  }
  sanitize(user) {
    const { password, __v, ...rest } =
      user && user.toObject ? user.toObject() : user;
    return rest;
  }
}
module.exports = new AuthService(userRepo);
