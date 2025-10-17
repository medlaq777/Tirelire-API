import ContributionService from "../services/contribution.service.js";

class ContributionController {
  async initRounds(req, res, next) {
    try {
      const { groupId } = req.body;
      const rounds = await ContributionService.initContributionRounds(groupId);
      res.status(201).json({ message: "Rounds initialized", rounds });
    } catch (err) {
      next(err);
    }
  }
  async completeRound(req, res, next) {
    try {
      const { groupId } = req.body;
      const result = await ContributionService.completeCurrentRound(groupId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const { groupId } = req.params;
      const rounds = await ContributionService.listGroupRounds(groupId);
      res.json(rounds);
    } catch (err) {
      next(err);
    }
  }
}
export default new ContributionController();
