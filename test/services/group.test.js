import { GroupService } from "../../src/services/group.service.js";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
const mockGroupRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  joinGroup: jest.fn(),
  findByOwner: jest.fn(),
};

let groupService;
const mockOwnerId = "user-owner-1";
const mockGroupId = "group-123";
const mockGroupData = {
  name: "Summer Savings",
  description: "Vacation fund",
  amount: 500,
  deadline: new Date().toISOString(),
  owner: mockOwnerId,
};

const mockCreatedGroup = {
  _id: mockGroupId,
  ...mockGroupData,
  members: [mockOwnerId],
  status: "open",
};

beforeEach(() => {
  jest.clearAllMocks();
  groupService = new GroupService(mockGroupRepo);
});

describe("GroupService.createGroupe", () => {
  it("throw 400 error if name is missing", async () => {
    await expect(
      groupService.createGroupe({
        description: "Test",
        amount: 100,
        deadline: "2024-12-31",
        owner: mockOwnerId,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "Name, amount and deadline are required",
    });
    expect(mockGroupRepo.create).not.toHaveBeenCalled();
  });

  it("throw 400 error if amount is missing", async () => {
    await expect(
      groupService.createGroupe({
        name: "Test",
        description: "Test",
        deadline: "2024-12-31",
        owner: mockOwnerId,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "Name, amount and deadline are required",
    });
  });
  it("successfully create a new group and add owner to members", async () => {
    mockGroupRepo.create.mockResolvedValue(mockCreatedGroup);
    const result = await groupService.createGroupe(mockGroupData);
    expect(mockGroupRepo.create).toHaveBeenCalledWith({
      ...mockGroupData,
      members: [mockOwnerId],
    });
    expect(result).toEqual(mockCreatedGroup);
  });
});

describe("GroupService.joinGroup", () => {
  const mockJoinerId = "user-joiner-2";
  it("throw error if the groupe is not found", async () => {
    mockGroupRepo.findById.mockResolvedValue(null);
    await expect(
      groupService.joinGroup(mockGroupId, mockJoinerId)
    ).rejects.toThrow("Group not found");
    expect(mockGroupRepo.joinGroup).not.toHaveBeenCalled();
  });

  it("throw error if the group is closed", async () => {
    const closedGroup = { ...mockCreatedGroup, status: "closed" };
    mockGroupRepo.findById.mockResolvedValue(closedGroup);
    await expect(
      groupService.joinGroup(mockGroupId, mockJoinerId)
    ).rejects.toThrow("Group is closed");
    expect(mockGroupRepo.joinGroup).not.toHaveBeenCalled();
  });

  it("successfully join the group if open", async () => {
    const updatedGroup = {
      ...mockCreatedGroup,
      members: [mockOwnerId, mockJoinerId],
    };
    mockGroupRepo.findById.mockResolvedValue(mockCreatedGroup);
    mockGroupRepo.joinGroup.mockResolvedValue(updatedGroup);
    const result = await groupService.joinGroup(mockGroupId, mockJoinerId);
    expect(mockGroupRepo.findById).toHaveBeenCalledWith(mockGroupId);
    expect(mockGroupRepo.joinGroup).toHaveBeenCalledWith(
      mockGroupId,
      mockJoinerId
    );
    expect(result).toEqual(updatedGroup);
  });
});

describe("GroupService.getGroup", () => {
  it("throw error if the group is not found", async () => {
    mockGroupRepo.findById.mockResolvedValue(null);
    await expect(groupService.getGroup(mockGroupId)).rejects.toThrow(
      "Group not found"
    );
  });

  it("return the group if found", async () => {
    mockGroupRepo.findById.mockResolvedValue(mockCreatedGroup);
    const result = await groupService.getGroup(mockGroupId);
    expect(mockGroupRepo.findById).toHaveBeenCalledWith(mockGroupId);
    expect(result).toEqual(mockCreatedGroup);
  });
});

describe("GroupService.listUserGroups", () => {
  it("call findByOwner with the correct userId get result", async () => {
    const mockCreateGroup = { ...mockCreatedGroup };
    const mockOwnedGroups = [
      mockCreateGroup,
      { ...mockCreatedGroup, _id: "g2" },
    ];
    mockGroupRepo.findByOwner.mockResolvedValue(mockOwnedGroups);
    const result = await groupService.listUserGroups(mockOwnerId);
    expect(mockGroupRepo.findByOwner).toHaveBeenLastCalledWith(mockOwnerId);
    expect(result).toEqual(mockOwnedGroups);
  });

  it("return an empty array if no groups are found", async () => {
    mockGroupRepo.findByOwner.mockResolvedValue([]);
    const result = await groupService.listUserGroups(mockGroupId);
    expect(result).toEqual([]);
  });
});

describe("GroupService constructor", () => {
  it("sets repo instance", () => {
    const repo = {};
    const service = new GroupService(repo);
    expect(service.repo).toBe(repo);
  });
});

describe("GroupService edge cases", () => {
  it("createGroupe throws if deadline is missing", async () => {
    await expect(
      groupService.createGroupe({
        name: "Test",
        amount: 100,
        description: "desc",
        owner: mockOwnerId,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "Name, amount and deadline are required",
    });
  });

  it("listUserGroups returns undefined if repo returns undefined", async () => {
    mockGroupRepo.findByOwner.mockResolvedValue(undefined);
    const result = await groupService.listUserGroups(mockOwnerId);
    expect(result).toBeUndefined();
  });
});
