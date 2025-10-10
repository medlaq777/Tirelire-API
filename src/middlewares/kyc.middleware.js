import Kyc from "../services/kyc.service";

class KycMiddleware {
  static async requireKyc(req, res, next) {
    try {
      const userId = req.user && req.user.id;
      if (!userId) {
        const e = new Error("unauthorized");
        e.status = 401;
        throw e;
      }
      const approved = await Kyc.isUserKycApproved(userId);
      if (!approved) {
        const r = new Error("Kyw Required for this action");
        e.status = 403;
        throw e;
      }
      next();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = KycMiddleware;
