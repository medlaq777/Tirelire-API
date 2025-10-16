import Group from "../models/group.model.js";

class GroupRepository {
  async create(data) {
    return new Group(data).save();
  }

  async findById(id) {
    return Group.findById(id).populate("owner members").exec();
  }
  async findByOwner(ownerId) {
    return Group.find({ owner: ownerId }).exec();
  }

  async joinGroup(groupId, userId) {
    return Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { members: userId } },
      { new: true }
    ).exec();
  }

  async update(groupId, data) {
    return Group.findByIdAndUpdate(groupId, data, { new: true });
  }
}

export default new GroupRepository();
