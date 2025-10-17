import controller from "../../src/controllers/group.controller.js";
const mockService = {
  createGroupe: jest.fn(),
  joinGroup: jest.fn(),
  listUserGroups: jest.fn(),
};

describe("GroupController", () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, params: {}, user: { id: "u1" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    controller.service = mockService;
    jest.clearAllMocks();
  });

  it("create: should return 201 and result", async () => {
    const result = { id: 1 };
    mockService.createGroupe.mockResolvedValue(result);
    req.body = { name: "g" };
    await controller.create(req, res, next);
    expect(mockService.createGroupe).toHaveBeenCalledWith({
      ...req.body,
      owner: "u1",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("create: should call next on error", async () => {
    mockService.createGroupe.mockRejectedValue(new Error("fail"));
    await controller.create(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("join: should return result", async () => {
    const result = { joined: true };
    mockService.joinGroup.mockResolvedValue(result);
    req.params.groupId = "g1";
    await controller.join(req, res, next);
    expect(mockService.joinGroup).toHaveBeenCalledWith("g1", "u1");
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("join: should call next on error", async () => {
    mockService.joinGroup.mockRejectedValue(new Error("fail"));
    req.params.groupId = "g1";
    await controller.join(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("list: should return groups", async () => {
    const groups = [1, 2];
    mockService.listUserGroups.mockResolvedValue(groups);
    await controller.list(req, res, next);
    expect(mockService.listUserGroups).toHaveBeenCalledWith("u1");
    expect(res.json).toHaveBeenCalledWith(groups);
  });

  it("list: should call next on error", async () => {
    mockService.listUserGroups.mockRejectedValue(new Error("fail"));
    await controller.list(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
