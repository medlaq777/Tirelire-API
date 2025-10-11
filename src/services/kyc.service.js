import Kyc from "../repositories/kyc.repository.js";
import Crypto from "../utils/crypto.js";
import Face from "../utils/face.js";
import Config from "../config/config.js";

class KycService {
  constructor(kyc, crypto, face) {
    this.kyc = kyc;
    this.crypto = crypto;
    this.face = face;
    this.threshold = parseFloat(Config.keyFaceThreshold || "0.6");
  }

  async submitKyc({ userId, fullname, nationalId, idImgBuffer, selfieBuffer }) {
    if (!fullname || !nationalId) {
      const e = new Error("fullname and national ID are required");
      e.status = 400;
      throw e;
    }

    const idMeta = await this.crypto.encryptAndSave(idImgBuffer);
    const selfieMeta = await this.crypto.encryptAndSave(selfieBuffer);
    const kyc = await this.kyc.create({
      user: userId,
      fullname,
      nationalId,
      idImageMeta: idMeta,
      selfieMeta: selfieMeta,
      status: "pending",
    });

    try {
      const idBuffer = await this.crypto.decryptFromFileMeta(idMeta);
      const selfieBufferDec = await this.crypto.decryptFromFileMeta(selfieMeta);
      const result = await this.face.compareImages(
        idBuffer,
        selfieBufferDec,
        this.threshold
      );
      if (result.distance === null) {
        await this.kyc.updateStatus(kyc._id, "pending", {
          method: "auto",
          score: null,
          note: "face_not_detected",
        });
        return { kyc, auto: false, reason: "face_not_detected" };
      }
      const newStatus = result.match ? "approved" : "pending";
      await this.kyc.updateStatus(kyc._id, newStatus, {
        method: "auto",
        score: result.distance,
        note: result.match ? "auto_approved" : "distance_above_threshold",
      });
      return {
        kyc: await this.kyc.findById(kyc._id),
        auto: true,
        result,
      };
    } catch (err) {
      await this.kyc.updateStatus(kyc._id, "pending", {
        method: "auto",
        note: "auto_error",
      });
      return { kyc, auto: false, error: err.message };
    }
  }

  async adminApprove(kycId, approve, adminId, note = "") {
    const status = approve ? "approved" : "rejected";
    const verification = {
      method: "manual",
      score: null,
      nore: `by:${adminId} ${note}`,
    };
    return this.kyc.updateStatus(kycId, status, verification);
  }

  async isUserKycApproved(userId) {
    const doc = await this.kyc.findByUserId(userId);
    return doc && doc.status === "approved";
  }
}

export default new KycService(Kyc, new Crypto(), new Face());
