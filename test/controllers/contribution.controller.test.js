import controller from "../../controllers/contribution.controller.js";
import ContributionService from "../../services/contribution.service.js";

jest.mock("../../services/contribution.service.js");
const mockService = ContributionService;

describe("ContributionController", () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, params: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
    mockService.initContributionRounds = jest.fn();
    mockService.completeCurrentRound = jest.fn();
    mockService.listGroupRounds = jest.fn();
  });

  it("initRounds: should return 201 and rounds", async () => {
    const rounds = [1, 2];
    mockService.initContributionRounds.mockResolvedValue(rounds);
    req.body.groupId = "g1";
    await controller.initRounds(req, res, next);
    expect(mockService.initContributionRounds).toHaveBeenCalledWith("g1");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Rounds initialized",
      rounds,
    });
  });

  it("initRounds: should call next on error", async () => {
    mockService.initContributionRounds.mockRejectedValue(new Error("fail"));
    req.body.groupId = "g1";
    await controller.initRounds(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("completeRound: should return result", async () => {
    const result = { done: true };
    mockService.completeCurrentRound.mockResolvedValue(result);
    req.body.groupId = "g1";
    await controller.completeRound(req, res, next);
    expect(mockService.completeCurrentRound).toHaveBeenCalledWith("g1");
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("completeRound: should call next on error", async () => {
    mockService.completeCurrentRound.mockRejectedValue(new Error("fail"));
    req.body.groupId = "g1";
    await controller.completeRound(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("list: should return rounds", async () => {
    const rounds = [1, 2];
    mockService.listGroupRounds.mockResolvedValue(rounds);
    req.params.groupId = "g1";
    await controller.list(req, res, next);
    expect(mockService.listGroupRounds).toHaveBeenCalledWith("g1");
    expect(res.json).toHaveBeenCalledWith(rounds);
  });

  it("list: should call next on error", async () => {
    mockService.listGroupRounds.mockRejectedValue(new Error("fail"));
    req.params.groupId = "g1";
    await controller.list(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
