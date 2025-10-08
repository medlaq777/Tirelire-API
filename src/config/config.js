class config {
  constructor() {
    this.port = process.env.PORT;
    this.mongoUri = process.env.MONGO_URI;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN;
  }
}

module.exports = new config();
