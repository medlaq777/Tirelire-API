import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
} from "@jest/globals";
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

const mockUserRepo = {
  setKycVerified: jest.fn().mockResolvedValue(true),
};

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

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  Kyc = new KycServiceInstance(mockKycRepo, mockCrypto, mockFace, mockUserRepo);
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
    mockKycRepo.updateStatus.mockResolvedValue(mockApprovedKyc);
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
    expect(mockUserRepo.setKycVerified).toHaveBeenCalledWith(
      mockApprovedKyc.user,
      true
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
    mockKycRepo.updateStatus.mockResolvedValue({
      ...mockInitialKyc,
      status: "pending",
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
    expect(mockUserRepo.setKycVerified).not.toHaveBeenCalled();
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
    mockKycRepo.updateStatus.mockResolvedValue({
      ...mockInitialKyc,
      status: "pending",
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
    expect(mockUserRepo.setKycVerified).not.toHaveBeenCalled();
    expect(result.auto).toBe(false);
    expect(result.reason).toBe("face_not_detected");
    expect(mockKycRepo.findById).not.toHaveBeenCalled();
  });

  it(`Kyc as pending with 'auto_error' whene the image decryption or comparison fails`, async () => {
    mockCrypto.encryptAndSave.mockResolvedValue(mockIdMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    const mockError = new Error("Decryption failed due to file corruption");
    mockCrypto.decryptFromFileMeta.mockRejectedValue(mockError);
    mockKycRepo.updateStatus.mockResolvedValue({
      ...mockInitialKyc,
      status: "pending",
    });

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
    expect(mockUserRepo.setKycVerified).not.toHaveBeenCalled();
    expect(result.auto).toBe(false);
    expect(result.error).toBe("Decryption failed due to file corruption");
    expect(mockFace.compareImages).not.toHaveBeenCalled();
  });
});

describe("Kyc.adminApprove", () => {
  const adminId = "admin-999";
  const note = "manual check complete, hight quality photos";
  it(`updateStatus to 'approved' whene approve is true`, async () => {
    const updated = { status: "approved", user: mockUserId };
    mockKycRepo.updateStatus.mockResolvedValue(updated);
    await Kyc.adminApprove(mockKycId, true, adminId, note);
    expect(mockKycRepo.updateStatus).toHaveBeenLastCalledWith(
      mockKycId,
      "approved",
      expect.objectContaining({
        method: "manual",
        note: `by:${adminId} ${note}`,
      })
    );
    expect(mockUserRepo.setKycVerified).toHaveBeenCalledWith(mockUserId, true);
  });
  it(`updateStatus to 'rejected' whene approve is false`, async () => {
    const updated = { status: "rejected", user: mockUserId };
    mockKycRepo.updateStatus.mockResolvedValue(updated);
    await Kyc.adminApprove(mockKycId, false, adminId, note);
    expect(mockKycRepo.updateStatus).toHaveBeenCalledWith(
      mockKycId,
      "rejected",
      expect.objectContaining({
        method: "manual",
        note: `by:${adminId} ${note}`,
      })
    );
    expect(mockUserRepo.setKycVerified).toHaveBeenCalledWith(mockUserId, false);
  });

  it("handles error in setKycVerified gracefully for approve", async () => {
    const updated = { status: "approved", user: mockUserId };
    mockKycRepo.updateStatus.mockResolvedValue(updated);
    mockUserRepo.setKycVerified.mockImplementationOnce(() => {
      throw new Error("fail");
    });
    await expect(
      Kyc.adminApprove(mockKycId, true, adminId, note)
    ).resolves.toEqual(updated);
    expect(mockKycRepo.updateStatus).toHaveBeenCalled();
  });

  it("handles error in setKycVerified gracefully for reject", async () => {
    const updated = { status: "rejected", user: mockUserId };
    mockKycRepo.updateStatus.mockResolvedValue(updated);
    mockUserRepo.setKycVerified.mockImplementationOnce(() => {
      throw new Error("fail");
    });
    await expect(
      Kyc.adminApprove(mockKycId, false, adminId, note)
    ).resolves.toEqual(updated);
    expect(mockKycRepo.updateStatus).toHaveBeenCalled();
  });
});

describe("KycService async error branches", () => {
  it("handles async rejection in setKycVerified for approve", async () => {
    const adminId = "admin-999";
    const note = "manual check complete, hight quality photos";
    const updated = { status: "approved", user: mockUserId };
    mockKycRepo.updateStatus.mockResolvedValue(updated);
    mockUserRepo.setKycVerified.mockImplementationOnce(() =>
      Promise.reject(new Error("fail"))
    );
    await expect(
      Kyc.adminApprove(mockKycId, true, adminId, note)
    ).resolves.toEqual(updated);
    expect(mockKycRepo.updateStatus).toHaveBeenCalled();
  });

  it("handles async rejection in setKycVerified for reject", async () => {
    const adminId = "admin-999";
    const note = "manual check complete, hight quality photos";
    const updated = { status: "rejected", user: mockUserId };
    mockKycRepo.updateStatus.mockResolvedValue(updated);
    mockUserRepo.setKycVerified.mockImplementationOnce(() =>
      Promise.reject(new Error("fail"))
    );
    await expect(
      Kyc.adminApprove(mockKycId, false, adminId, note)
    ).resolves.toEqual(updated);
    expect(mockKycRepo.updateStatus).toHaveBeenCalled();
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

  it("returns false when the KYC document status is not 'approved'", async () => {
    const pendingDoc = { status: "pending" };
    mockKycRepo.findByUserId.mockResolvedValue(pendingDoc);
    const result = await Kyc.isUserKycApproved(mockUserId);
    expect(result).toBe(false);
  });

  it("returns null when no KYC document is found for the user", async () => {
    mockKycRepo.findByUserId.mockResolvedValue(null);
    const result = await Kyc.isUserKycApproved(mockUserId);
    expect(result).toBe(null);
  });
});

describe("KycService edge cases", () => {
  it("should not call setKycVerified if userRepo is not provided", async () => {
    const KycNoUserRepo = new KycServiceInstance(
      mockKycRepo,
      mockCrypto,
      mockFace,
      null
    );
    mockCrypto.encryptAndSave.mockResolvedValue(mockIdMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    mockCrypto.decryptFromFileMeta.mockResolvedValue(mockIdImgBuffer);
    mockFace.compareImages.mockResolvedValue({ match: true, distance: 0.1 });
    mockKycRepo.findById.mockResolvedValue({
      ...mockInitialKyc,
      status: "approved",
    });
    mockKycRepo.updateStatus.mockResolvedValue({
      ...mockInitialKyc,
      status: "approved",
    });
    await KycNoUserRepo.submitKyc({
      userId: mockUserId,
      fullname: mockFullname,
      nationalId: mockNationalId,
      idImgBuffer: mockIdImgBuffer,
      selfieBuffer: mockSelfieBuffer,
    });
    expect(mockUserRepo.setKycVerified).not.toHaveBeenCalled();
  });
  it("should throw error if fullname or nationalId missing", async () => {
    await expect(
      Kyc.submitKyc({ userId: mockUserId, fullname: "" })
    ).rejects.toMatchObject({
      status: 400,
      message: "fullname and national ID are required",
    });
    await expect(
      Kyc.submitKyc({ userId: mockUserId, nationalId: "" })
    ).rejects.toMatchObject({
      status: 400,
      message: "fullname and national ID are required",
    });
  });

  it("should fallback to default threshold if config is missing", () => {
    jest.resetModules();
    const KycServiceLocal = require("../services/kyc.service.js").default;
    const fakeConfig = {};
    const service = new KycServiceLocal(
      mockKycRepo,
      mockCrypto,
      mockFace,
      null
    );
    expect(service.threshold).toBe(0.6);
  });
});

describe("Kyc.submitKyc face comparison edge cases", () => {
  it("Kyc as pending when match is true but distance is null", async () => {
    mockCrypto.encryptAndSave.mockResolvedValue(mockIdMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    mockCrypto.decryptFromFileMeta.mockResolvedValue(mockIdImgBuffer);
    mockFace.compareImages.mockResolvedValue({ match: true, distance: null });
    mockKycRepo.updateStatus.mockResolvedValue({
      ...mockInitialKyc,
      status: "pending",
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
  });

  it("Kyc as pending when match is false but distance is below threshold", async () => {
    mockCrypto.encryptAndSave.mockResolvedValue(mockIdMeta);
    mockKycRepo.create.mockResolvedValue(mockInitialKyc);
    mockCrypto.decryptFromFileMeta.mockResolvedValue(mockIdImgBuffer);
    mockFace.compareImages.mockResolvedValue({ match: false, distance: 0.1 });
    mockKycRepo.updateStatus.mockResolvedValue({
      ...mockInitialKyc,
      status: "pending",
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
        score: 0.1,
      })
    );
    expect(result.auto).toBe(true);
    expect(result.result.match).toBe(false);
    expect(result.result.distance).toBe(0.1);
  });
});
