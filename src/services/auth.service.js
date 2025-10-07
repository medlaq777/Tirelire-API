const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const jwToken = require("../utils/jwt");

exports.register = async (userData) => {
  const { email, password } = userData;
  const UserExists = await User.findOne({ email });
  if (UserExists) throw new Error("Email already in use");
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ email, hashedPassword });
  const token = jwToken.generateToken(newUser);
  return { user: newUser, token };
};
exports.login = async (userData) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid email or password");
  const isSame = await bcrypt.compare(password, user.password);
  if (!isSame) throw new Error("Invalid email or password");
  const token = jwToken.generateToken(user);
  return { user, token };
};
