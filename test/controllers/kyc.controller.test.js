import controller from "../../src/controllers/kyc.controller.js";
const mockService = {
  submitKyc: jest.fn(),
  adminApprove: jest.fn(),
};

describe("KycController", () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      body: {},
      user: { id: "u1" },
      files: {
        idImage: [{ buffer: Buffer.from("a") }],
        selfie: [{ buffer: Buffer.from("b") }],
      },
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    controller.service = mockService;
    jest.clearAllMocks();
  });

  it("submit: should return 201 and result", async () => {
    const result = { id: 1 };
    mockService.submitKyc.mockResolvedValue(result);
    req.body = { fullname: "f", nationalId: "n" };
    await controller.submit(req, res, next);
    expect(mockService.submitKyc).toHaveBeenCalledWith({
      userId: "u1",
      fullname: "f",
      nationalId: "n",
      idImgBuffer: expect.any(Buffer),
      selfieBuffer: expect.any(Buffer),
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("submit: should throw if files missing", async () => {
    req.files = {};
    await controller.submit(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it("submit: should call next on error", async () => {
    mockService.submitKyc.mockRejectedValue(new Error("fail"));
    await controller.submit(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("adminApprove: should return updated", async () => {
    mockService.adminApprove.mockResolvedValue(true);
    req.body = { kycId: "k1", approve: true, note: "n" };
    await controller.adminApprove(req, res, next);
    expect(mockService.adminApprove).toHaveBeenCalledWith(
      "k1",
      true,
      "u1",
      "n"
    );
    expect(res.json).toHaveBeenCalledWith({ updated: true });
  });

  it("adminApprove: should call next on error", async () => {
    mockService.adminApprove.mockRejectedValue(new Error("fail"));
    await controller.adminApprove(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
