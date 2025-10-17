import Kyc from "../repositories/kyc.repository.js";
import UserRepo from "../repositories/user.repository.js";
import Crypto from "../utils/crypto.js";
import Face from "../utils/face.js";
import Config from "../config/config.js";
import * as bcrypt from "bcryptjs";

class KycService {
  constructor(kyc, crypto, face, userRepo) {
    this.kyc = kyc;
    this.crypto = crypto;
    this.face = face;
    this.userRepo = userRepo;
    this.threshold = Number.parseFloat(Config.keyFaceThreshold);
  }

  async submitKyc({ userId, fullname, nationalId, idImgBuffer, selfieBuffer }) {
    if (!fullname || !nationalId) {
      const e = new Error("fullname and national ID are required");
      e.status = 400;
      throw e;
    }

    const idMeta = await this.crypto.encryptAndSave(idImgBuffer);
    const selfieMeta = await this.crypto.encryptAndSave(selfieBuffer);
    const hashed = await bcrypt.hash(nationalId, 10);
    const kyc = await this.kyc.create({
      user: userId,
      fullname,
      nationalId: hashed,
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
      const updated = await this.kyc.updateStatus(kyc._id, newStatus, {
        method: "auto",
        score: result.distance,
        note: result.match ? "auto_approved" : "distance_above_threshold",
      });

      if (newStatus === "approved" && this.userRepo?.setKycVerified) {
        try {
          this.userRepo.setKycVerified(updated.user, true).catch(() => {});
        } catch (e) {
          console.error("Error updating user KYC verification status:", e);
        }
      }
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
      note: `by:${adminId} ${note}`,
    };
    const updated = await this.kyc.updateStatus(kycId, status, verification);
    if (this.userRepo?.setKycVerified) {
      try {
        if (status === "approved") {
          this.userRepo.setKycVerified(updated.user, true).catch(() => {});
        } else if (status === "rejected") {
          this.userRepo.setKycVerified(updated.user, false).catch(() => {});
        }
      } catch (e) {
        console.error("Error updating user KYC verification status:", e);
      }
    }
    return updated;
  }

  async isUserKycApproved(userId) {
    const doc = await this.kyc.findByUserId(userId);
    return doc && doc.status === "approved";
  }
}

export default KycService;
export const kycService = new KycService(
  Kyc,
  new Crypto(),
  new Face(),
  UserRepo
);
