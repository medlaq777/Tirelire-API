import controller from "../../src/controllers/auth.controller";
const mockService = {
  register: jest.fn(),
  login: jest.fn(),
  profile: jest.fn(),
};

describe("AuthController", () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, user: { id: "user1" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    controller.service = mockService;
    jest.clearAllMocks();
  });

  it("register: should return 201 and result", async () => {
    const result = { id: 1 };
    mockService.register.mockResolvedValue(result);
    req.body = { email: "a" };
    await controller.register(req, res, next);
    expect(mockService.register).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("register: should call next on error", async () => {
    const err = new Error("register error");
    mockService.register.mockRejectedValue(err);
    await controller.register(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("login: should return 200 and result", async () => {
    const result = { token: "t" };
    mockService.login.mockResolvedValue(result);
    req.body = { email: "a" };
    await controller.login(req, res, next);
    expect(mockService.login).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("login: should call next on error", async () => {
    const err = new Error("login error");
    mockService.login.mockRejectedValue(err);
    await controller.login(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it("profile: should return user profile", async () => {
    const user = { id: "user1" };
    mockService.profile.mockResolvedValue(user);
    await controller.profile(req, res, next);
    expect(mockService.profile).toHaveBeenCalledWith("user1");
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it("profile: should call next on error", async () => {
    const err = new Error("profile error");
    mockService.profile.mockRejectedValue(err);
    await controller.profile(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
