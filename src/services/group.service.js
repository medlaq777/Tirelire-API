import GroupRepo from "../repositories/group.repository.js";

class GroupService {
  constructor(repo) {
    this.repo = repo;
  }

  async createGroupe({ name, description, amount, deadline, owner }) {
    if (!name || !amount || !deadline) {
      const e = new Error("Name, amount and deadline are required");
      e.status = 400;
      throw e;
    }
    return this.repo.create({
      name,
      description,
      amount,
      deadline,
      owner,
      members: [owner],
    });
  }

  async joinGroup(groupId, userId) {
    const group = await this.repo.findById(groupId);
    if (!group) throw new Error("Group not found");
    if (group.status === "closed") throw new Error("Group is closed");
    return this.repo.joinGroup(groupId, userId);
  }

  async getGroup(id) {
    const group = await this.repo.findById(id);
    if (!group) throw new Error("Group not found");
    return group;
  }

  async listUserGroups(userId) {
    const owned = await this.repo.findByOwner(userId);
    return owned;
  }
}

export { GroupService };
export default new GroupService(GroupRepo);
