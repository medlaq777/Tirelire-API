import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import bcrypt from "bcryptjs";
import KycService from "../services/kyc.service.js";
let KycServiceInstance = KycService;
let Kyc;

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("../config/config.js", () => ({
  keyFaceThreshold: "0.6",
}));

const mockKycRepo = {
  create: jest.fn(),
  updateStatus: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
};

const mockCrypto = {
  encryptAndSave: jest.fn(),
  decryptFromFileMeta: jest.fn(),
};

const mockFace = {
  compareImages: jest.fn(),
};

let kyc;

const mockUserId = "user-123";
const mockKycId = "kyc-456";
const mockFullname = "MOUHCINE TEMSAMANI";
const mockNationalId = "NID-789";
const mockHashedNid = "hashed_nid_10rounds";
const mockIdImgBuffer = Buffer.from("id-image-data");
const mockSelfieBuffer = Buffer.from("selfie-image-data");
const mockIdMeta = { fileId: "id-file-meta" };
const mockSelfieMeta = { fileId: "Selfie-file-meta" };
const mockInitialKyc = {
  _id: mockKycId,
  user: mockUserId,
  fullname: mockFullname,
  nationalId: mockHashedNid,
  status: "pending",
  toObject: () => ({ ...mockInitialKyc }),
};

beforeEach(() => {
  jest.clearAllMocks();
  Kyc = new KycServiceInstance(mockKycRepo, mockCrypto, mockFace);
  bcrypt.hash.mockResolvedValue(mockHashedNid);
});

describe("Kyc.submitKyc", () => {
  it("throw 400 error fullname and nationalId is missing", async () => {
    await expect(
      Kyc.submitKyc({ userId: mockUserId, fullname: mockFullname })
    ).rejects.toMatchObject({
      status: 400,
      message: "fullname and national ID are required",
    });
    await expect(
      Kyc.submitKyc({ userId: mockUserId, nationalId: mockNationalId })
    ).rejects.toMatchObject({
      status: 400,
      message: "fullname and national ID are required",
    });
    expect(mockCrypto.encryptAndSave).not.toHaveBeenCalled();
  });
  it("Successfully auto-approve Kyc whene face comparison matches the distance below threshold", async () => {
    const mockApprovedKyc = { ...mockInitialKyc, status: "approved" };
    mockCrypto.encryptAndSave
      .mockResolvedValueOnce(mockIdMeta)
      .mockResolvedValueOnce(mockSelfieMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    mockCrypto.decryptFromFileMeta
      .mockResolvedValueOnce(mockIdImgBuffer)
      .mockResolvedValueOnce(mockSelfieBuffer);
    mockFace.compareImages.mockResolvedValue({
      match: true,
      distance: 0.1,
    });
    mockKycRepo.findById.mockResolvedValue(mockApprovedKyc);
    const result = await Kyc.submitKyc({
      userId: mockUserId,
      fullname: mockFullname,
      nationalId: mockNationalId,
      idImgBuffer: mockIdImgBuffer,
      selfieBuffer: mockSelfieBuffer,
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(mockNationalId, 10);
    expect(mockKycRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nationalId: mockHashedNid,
      })
    );
    expect(mockFace.compareImages).toHaveBeenCalledWith(
      mockIdImgBuffer,
      mockSelfieBuffer,
      0.6
    );

    expect(mockKycRepo.updateStatus).toHaveBeenCalledWith(
      mockKycId,
      "approved",
      expect.objectContaining({
        method: "auto",
        score: 0.1,
        note: "auto_approved",
      })
    );
    expect(result.auto).toBe(true);
    expect(result.kyc).toBe(mockApprovedKyc);
  });

  it("Kyc as pending whene face comparison distance too hight (no match)", async () => {
    mockCrypto.encryptAndSave.mockResolvedValue(mockIdMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    mockCrypto.decryptFromFileMeta.mockResolvedValue(mockIdImgBuffer);
    mockFace.compareImages.mockResolvedValue({
      match: false,
      distance: 0.7,
    });

    const result = await Kyc.submitKyc({
      userId: mockUserId,
      fullname: mockFullname,
      nationalId: mockNationalId,
      idImgBuffer: mockIdImgBuffer,
      selfieBuffer: mockSelfieBuffer,
    });
    expect(mockKycRepo.updateStatus).toHaveBeenCalledWith(
      mockKycId,
      "pending",
      expect.objectContaining({
        method: "auto",
        note: "distance_above_threshold",
      })
    );
    expect(result.auto).toBe(true);
    expect(result.result.match).toBe(false);
  });
  it("Kyc as pending whene no face detected (distance is null)", async () => {
    mockCrypto.encryptAndSave.mockResolvedValue(mockIdMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    mockCrypto.decryptFromFileMeta.mockResolvedValue(mockIdImgBuffer);
    mockFace.compareImages.mockResolvedValue({
      match: false,
      distance: null,
    });
    const result = await Kyc.submitKyc({
      userId: mockUserId,
      fullname: mockFullname,
      nationalId: mockNationalId,
      idImgBuffer: mockIdImgBuffer,
      selfieBuffer: mockSelfieBuffer,
    });

    expect(mockKycRepo.updateStatus).toHaveBeenCalledWith(
      mockKycId,
      "pending",
      expect.objectContaining({
        method: "auto",
        note: "face_not_detected",
        score: null,
      })
    );
    expect(result.auto).toBe(false);
    expect(result.reason).toBe("face_not_detected");
    expect(mockKycRepo.findById).not.toHaveBeenCalled();
  });

  it(`Kyc as pending with 'auto_error' whene the image decryption or comparison fails`, async () => {
    mockCrypto.encryptAndSave.mockResolvedValue(mockIdMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    const mockError = new Error("Decryption failed due to file corruption");
    mockCrypto.decryptFromFileMeta.mockRejectedValue(mockError);

    const result = await Kyc.submitKyc({
      userId: mockUserId,
      fullname: mockFullname,
      nationalId: mockNationalId,
      idImgBuffer: mockIdImgBuffer,
      selfieBuffer: mockSelfieBuffer,
    });

    expect(result.kyc).toBe(mockInitialKyc);
    expect(mockKycRepo.updateStatus).toHaveBeenCalledWith(
      mockKycId,
      "pending",
      expect.objectContaining({
        method: "auto",
        note: "auto_error",
      })
    );
    expect(result.auto).toBe(false);
    expect(result.error).toBe("Decryption failed due to file corruption");
    expect(mockFace.compareImages).not.toHaveBeenCalled();
  });
});

describe("Kyc.adminApprove", () => {
  const adminId = "admin-999";
  const note = "manual check complete, hight quality photos";
  it(`updateStatus to 'approved' whene approve is true`, async () => {
    mockKycRepo.updateStatus.mockResolvedValue({
      status: "approved",
    });
    await Kyc.adminApprove(mockKycId, true, adminId, note);
    expect(mockKycRepo.updateStatus).toHaveBeenLastCalledWith(
      mockKycId,
      "approved",
      expect.objectContaining({
        method: "manual",
        note: `by:${adminId} ${note}`,
      })
    );
  });
  it(`updateStatus to 'rejected' whene approve is false`, async () => {
    mockKycRepo.updateStatus.mockResolvedValue({ status: "rejected" });
    await Kyc.adminApprove(mockKycId, false, adminId, note);
    expect(mockKycRepo.updateStatus).toHaveBeenCalledWith(
      mockKycId,
      "rejected",
      expect.objectContaining({
        method: "manual",
        note: `by:${adminId} ${note}`,
      })
    );
  });
});

describe("Kyc.isUserKycApproved", () => {
  it("KYC document exists and status is 'approved'", async () => {
    const approvedDoc = { status: "approved" };
    mockKycRepo.findByUserId.mockResolvedValue(approvedDoc);
    const result = await Kyc.isUserKycApproved(mockUserId);
    expect(mockKycRepo.findByUserId).toHaveBeenCalledWith(mockUserId);
    expect(result).toBe(true);
  });

  it("flase whene the KYC document status is 'pending'", async () => {
    const pendingDoc = { status: "pending" };
    mockKycRepo.findByUserId.mockResolvedValue(pendingDoc);
    const result = await Kyc.isUserKycApproved(mockUserId);
    expect(result).toBe(false);
  });

  it("false whene no KYC document is found for the user", async () => {
    mockKycRepo.findByUserId.mockResolvedValue(null);
    const result = await Kyc.isUserKycApproved(mockUserId);
    expect(result).toBe(null);
  });
});
