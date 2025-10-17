import ReliabilityService from "../services/reliability.service.js";
import User from "../models/user.model.js";

jest.mock("../models/user.model.js", () => ({
  findById: jest.fn(),

  select: jest.fn().mockReturnThis(),
}));

let reliabilityService;
const mockUserId = "user-reliable-1";
const mockInitialScore = 90;

const createMockUser = (score) => ({
  _id: mockUserId,
  reliabilityScore: score,
  name: "Test User",
  email: "test@example.com",
  save: jest.fn().mockResolvedValue(true),
});

beforeAll(() => {
  reliabilityService = new ReliabilityService();
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ReliabilityService.updateScore", () => {
  it("should throw an error if user is not found", async () => {
    User.findById.mockResolvedValue(null);

    await expect(
      reliabilityService.updateScore(mockUserId, "success")
    ).rejects.toThrow("User not found");

    expect(User.findById).toHaveBeenCalledWith(mockUserId);
  });

  it("should increase score by 1 for 'success' action, capping at 100", async () => {
    const mockUser = createMockUser(mockInitialScore);
    User.findById.mockResolvedValue(mockUser);

    const newScore = await reliabilityService.updateScore(
      mockUserId,
      "success"
    );

    expect(newScore).toBe(mockInitialScore + 1);
    expect(mockUser.reliabilityScore).toBe(91);
    expect(mockUser.save).toHaveBeenCalledTimes(1);

    const mockUserMax = createMockUser(100);
    User.findById.mockResolvedValue(mockUserMax);
    const cappedScore = await reliabilityService.updateScore(
      mockUserId,
      "success"
    );
    expect(cappedScore).toBe(100);
  });

  it("should decrease score by 2 for 'fail' action, floor at 0", async () => {
    const mockUser = createMockUser(mockInitialScore);
    User.findById.mockResolvedValue(mockUser);

    const newScore = await reliabilityService.updateScore(mockUserId, "fail");

    expect(newScore).toBe(mockInitialScore - 2);
    expect(mockUser.reliabilityScore).toBe(88);
    expect(mockUser.save).toHaveBeenCalledTimes(1);

    const mockUserMin = createMockUser(1);
    User.findById.mockResolvedValue(mockUserMin);
    const flooredScore = await reliabilityService.updateScore(
      mockUserId,
      "fail"
    );
    expect(flooredScore).toBe(0);
  });

  it("should decrease score by 1 for 'late' action, floor at 0", async () => {
    const mockUser = createMockUser(mockInitialScore);
    User.findById.mockResolvedValue(mockUser);

    const newScore = await reliabilityService.updateScore(mockUserId, "late");

    expect(newScore).toBe(mockInitialScore - 1);
    expect(mockUser.reliabilityScore).toBe(89);
    expect(mockUser.save).toHaveBeenCalledTimes(1);

    const mockUserZero = createMockUser(0);
    User.findById.mockResolvedValue(mockUserZero);
    const flooredScore = await reliabilityService.updateScore(
      mockUserId,
      "late"
    );
    expect(flooredScore).toBe(0);
    expect(mockUserZero.reliabilityScore).toBe(0);
  });

  it("should use default score of 100 if user.reliabilityScore is undefined or null", async () => {
    const mockUser = createMockUser(null);
    mockUser.reliabilityScore = undefined;
    User.findById.mockResolvedValue(mockUser);

    const newScore = await reliabilityService.updateScore(mockUserId, "fail");

    expect(newScore).toBe(98);
    expect(mockUser.reliabilityScore).toBe(98);
  });

  it("should do nothing for default/unknown actions", async () => {
    const mockUser = createMockUser(mockInitialScore);
    User.findById.mockResolvedValue(mockUser);

    const newScore = await reliabilityService.updateScore(
      mockUserId,
      "unknown_action"
    );

    expect(newScore).toBe(mockInitialScore);
    expect(mockUser.reliabilityScore).toBe(90);
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });
});

describe("ReliabilityService.getScore", () => {
  it("should throw an error if user is not found", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });
    await expect(reliabilityService.getScore(mockUserId)).rejects.toThrow(
      "User not found"
    );
  });

  it("should return the user's reliability score and call findById with select", async () => {
    const mockUser = createMockUser(mockInitialScore);
    const selectMock = jest.fn().mockResolvedValue(mockUser);
    User.findById.mockReturnValue({ select: selectMock });

    const score = await reliabilityService.getScore(mockUserId);

    expect(User.findById).toHaveBeenCalledWith(mockUserId);
    expect(selectMock).toHaveBeenCalledWith("reliabilityScore name email");
    expect(score).toBe(mockInitialScore);
  });
});
