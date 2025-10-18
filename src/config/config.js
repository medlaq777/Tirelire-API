const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  fileEncryptionKey: process.env.FILE_ENCRYPTION_KEY,
  stripeSecret: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
};

export default config;
