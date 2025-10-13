import GroupService from "../services/group.service.js";

class GroupController {
  constructor(service = GroupService) {
    this.service = service;
  }

  async create(req, res, next) {
    try {
      const owner = req.user.id;
      const result = await this.service.createGroupe({ ...req.body, owner });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async join(req, res, next) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;
      const result = await this.service.joinGroup(groupId, userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const groups = await this.service.listUserGroups(userId);
      res.json(groups);
    } catch (err) {
      next(err);
    }
  }
}

export default new GroupController(GroupService);
