import { kycService as Kyc } from "../services/kyc.service.js";

class KycController {
  constructor(service = Kyc) {
    this.service = service;
  }

  async submit(req, res, next) {
    try {
      const { fullname, nationalId } = req.body;
      const userId = req.user.id;
      if (!req.files || !req.files["idImage"] || !req.files["selfie"]) {
        const e = new Error("required ID image and Selfie");
      }
      const idBuf = req.files["idImage"][0].buffer;
      const selfieBuf = req.files["selfie"][0].buffer;
      const result = await this.service.submitKyc({
        userId,
        fullname,
        nationalId,
        idImgBuffer: idBuf,
        selfieBuffer: selfieBuf,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async adminApprove(req, res, next) {
    try {
      const { kycId } = req.params;
      const { approve, note } = req.body;
      const adminId = req.user.id;
      const updated = await this.service.adminApprove(
        kycId,
        approve === true || approve === "true",
        adminId,
        note
      );
      res.json({ updated });
    } catch (err) {
      next(err);
    }
  }
}

export default new KycController(Kyc);
