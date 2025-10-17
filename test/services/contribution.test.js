import ContributionService from "../../src/services/contribution.service.js";
const mockContribRepo = {
  create: jest.fn(),
  findActiveByGroup: jest.fn(),
  markCompleted: jest.fn(),
  findByGroup: jest.fn(),
  updateStatus: jest.fn(),
};

const mockGroupRepo = {
  findById: jest.fn(),
};

const mockReliabilityService = {
  getScore: jest.fn(),
};

const mockPaymentRepo = {
  findByGroup: jest.fn(),
};

let contributionService;
const mockGroupId = "group-test-1";
const mockMembers = ["user-high", "user-medium", "user-low"];
const mockScores = {
  "user-high": 95,
  "user-medium": 80,
  "user-low": 60,
};

mockReliabilityService.getScore.mockImplementation(async (userId) => {
  return mockScores[userId];
});

beforeEach(() => {
  jest.clearAllMocks();

  contributionService = new ContributionService(
    mockContribRepo,
    mockGroupRepo,
    mockReliabilityService,
    mockPaymentRepo
  );
});

describe("ContributionService.initContributionRounds", () => {
  const mockGroup = { _id: mockGroupId, members: mockMembers };

  it("should throw an error if groupId is missing", async () => {
    await expect(
      contributionService.initContributionRounds(null)
    ).rejects.toThrow("groupId is required");
  });

  it("should throw an error if Group not found", async () => {
    mockGroupRepo.findById.mockResolvedValue(null);

    await expect(
      contributionService.initContributionRounds(mockGroupId)
    ).rejects.toThrow("Group not found");
  });

  it("should correctly sort members by reliability score and create rounds", async () => {
    mockGroupRepo.findById.mockResolvedValue(mockGroup);

    mockContribRepo.create.mockImplementation((data) =>
      Promise.resolve({ ...data, _id: `round-${data.roundNumber}` })
    );

    const result = await contributionService.initContributionRounds(
      mockGroupId
    );

    expect(mockReliabilityService.getScore).toHaveBeenCalledTimes(
      mockMembers.length
    );

    expect(mockContribRepo.create).toHaveBeenCalledTimes(mockMembers.length);

    expect(mockContribRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        group: mockGroupId,
        roundNumber: 1,
        beneficiary: "user-high",
        status: "active",
        startDate: expect.any(Date),
      })
    );

    expect(mockContribRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        group: mockGroupId,
        roundNumber: 2,
        beneficiary: "user-medium",
        status: "pending",
        startDate: null,
      })
    );

    expect(result.length).toBe(mockMembers.length);
    expect(result[0].beneficiary).toBe("user-high");
    expect(result[2].beneficiary).toBe("user-low");
  });
});

describe("ContributionService.completeCurrentRound", () => {
  const mockActiveRound = {
    _id: "round-active",
    roundNumber: 1,
    group: mockGroupId,
  };
  const mockNextRound = {
    _id: "round-next",
    roundNumber: 2,
    group: mockGroupId,
    status: "pending",
  };
  const mockCompletedRound = { ...mockActiveRound, status: "completed" };
  const mockAllRounds = [mockCompletedRound, mockNextRound];

  it("should throw an error if no active round is found", async () => {
    mockContribRepo.findActiveByGroup.mockResolvedValue(null);

    await expect(
      contributionService.completeCurrentRound(mockGroupId)
    ).rejects.toThrow("No active round found");
    expect(mockPaymentRepo.findByGroup).not.toHaveBeenCalled();
  });

  it("should throw an error if not all payments succeeded", async () => {
    mockContribRepo.findActiveByGroup.mockResolvedValue(mockActiveRound);
    const mockPayments = [{ status: "succeeded" }, { status: "pending" }];
    mockPaymentRepo.findByGroup.mockResolvedValue(mockPayments);

    await expect(
      contributionService.completeCurrentRound(mockGroupId)
    ).rejects.toThrow("Not all payments completed");
    expect(mockContribRepo.markCompleted).not.toHaveBeenCalled();
  });

  it("should successfully complete current round and activate the next one", async () => {
    mockContribRepo.findActiveByGroup.mockResolvedValue(mockActiveRound);
    const mockSuccessfulPayments = [
      { status: "succeeded" },
      { status: "succeeded" },
    ];
    mockPaymentRepo.findByGroup.mockResolvedValue(mockSuccessfulPayments);
    mockContribRepo.findByGroup.mockResolvedValue(mockAllRounds);
    mockContribRepo.markCompleted.mockResolvedValue(true);
    mockContribRepo.updateStatus.mockResolvedValue({
      ...mockNextRound,
      status: "active",
    });

    const result = await contributionService.completeCurrentRound(mockGroupId);

    expect(mockContribRepo.findActiveByGroup).toHaveBeenCalledWith(mockGroupId);
    expect(mockPaymentRepo.findByGroup).toHaveBeenCalledWith(mockGroupId);
    expect(mockContribRepo.markCompleted).toHaveBeenCalledWith(
      mockActiveRound._id
    );
    expect(mockContribRepo.findByGroup).toHaveBeenCalledWith(mockGroupId);
    expect(mockContribRepo.updateStatus).toHaveBeenCalledWith(
      mockNextRound._id,
      "active"
    );
    expect(result).toEqual({ message: "Round completed successfully" });
  });

  it("should complete the current round but do nothing if it's the last round", async () => {
    const mockLastRound = { _id: "r1", roundNumber: 1, group: mockGroupId };
    mockContribRepo.findActiveByGroup.mockResolvedValue(mockLastRound);
    const mockSuccessfulPayments = [{ status: "succeeded" }];
    mockPaymentRepo.findByGroup.mockResolvedValue(mockSuccessfulPayments);
    mockContribRepo.findByGroup.mockResolvedValue([mockLastRound]);
    mockContribRepo.markCompleted.mockResolvedValue(true);

    const result = await contributionService.completeCurrentRound(mockGroupId);

    expect(mockContribRepo.markCompleted).toHaveBeenCalledWith(
      mockLastRound._id
    );
    expect(mockContribRepo.updateStatus).not.toHaveBeenCalled();
    expect(result).toEqual({ message: "Round completed successfully" });
  });
});

describe("ContributionService.listGroupRounds", () => {
  it("should call findByGroup with the correct groupId and return the result", async () => {
    const mockRoundsList = [
      { _id: "r1", roundNumber: 1 },
      { _id: "r2", roundNumber: 2 },
    ];
    mockContribRepo.findByGroup.mockResolvedValue(mockRoundsList);

    const result = await contributionService.listGroupRounds(mockGroupId);

    expect(mockContribRepo.findByGroup).toHaveBeenCalledWith(mockGroupId);
    expect(result).toEqual(mockRoundsList);
  });
});

describe("ContributionService constructor", () => {
  it("sets all repository and service instances", () => {
    const contribRepo = {};
    const groupRepo = {};
    const reliabilityService = {};
    const paymentRepo = {};
    const service = new ContributionService(
      contribRepo,
      groupRepo,
      reliabilityService,
      paymentRepo
    );
    expect(service.contribRepo).toBe(contribRepo);
    expect(service.groupRepo).toBe(groupRepo);
    expect(service.rereliabilityService).toBe(reliabilityService);
    expect(service.paymentRepo).toBe(paymentRepo);
  });
});

describe("ContributionService edge cases", () => {
  it("initContributionRounds throws if group.members is undefined", async () => {
    mockGroupRepo.findById.mockResolvedValue({ _id: mockGroupId });
    await expect(
      contributionService.initContributionRounds(mockGroupId)
    ).rejects.toThrow();
  });

  it("completeCurrentRound throws if payments is undefined", async () => {
    mockContribRepo.findActiveByGroup.mockResolvedValue({
      _id: "r1",
      roundNumber: 1,
    });
    mockPaymentRepo.findByGroup.mockResolvedValue(undefined);
    await expect(
      contributionService.completeCurrentRound(mockGroupId)
    ).rejects.toThrow();
  });

  it("completeCurrentRound throws if allRounds is undefined", async () => {
    mockContribRepo.findActiveByGroup.mockResolvedValue({
      _id: "r1",
      roundNumber: 1,
    });
    mockPaymentRepo.findByGroup.mockResolvedValue([{ status: "succeeded" }]);
    mockContribRepo.findByGroup.mockResolvedValue(undefined);
    mockContribRepo.markCompleted.mockResolvedValue(true);
    await expect(
      contributionService.completeCurrentRound(mockGroupId)
    ).rejects.toThrow();
  });
});
