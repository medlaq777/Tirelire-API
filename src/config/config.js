class config {
  constructor() {
    this.port = process.env.PORT || 3000;
    this.mongoUri = process.env.MONGO_URI;
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN;
    this.fileEncryptionKey = process.env.FILE_ENCRYPTION_KEY;
  }
}

export default new config();
