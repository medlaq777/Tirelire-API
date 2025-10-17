import GroupRepository from "../repositories/group.repository.js";
import ReliabilityService from "../services/reliability.service.js";
import PaymentRepository from "../repositories/payment.repository.js";
import contributionRepository from "../repositories/contribution.repository.js";

class ContributionService {
  constructor(contribRepo, groupRepo, reliabilityService, paymentRepo) {
    this.contribRepo = contribRepo;
    this.groupRepo = groupRepo;
    this.rereliabilityService = reliabilityService;
    this.paymentRepo = paymentRepo;
  }

  async initContributionRounds(groupId) {
    if (!groupId) throw new Error("groupId is required");
    const group = await this.groupRepo.findById(groupId);
    if (!group) throw new Error("Group not found");
    const members = group.members;
    const scoredMembers = [];
    for (const member of members) {
      const score = await this.rereliabilityService.getScore(member);
      scoredMembers.push({ member, score });
    }
    scoredMembers.sort((a, b) => b.score - a.score);

    const rounds = await Promise.all(
      scoredMembers.map((m, index) =>
        this.contribRepo.create({
          group: groupId,
          roundNumber: index + 1,
          beneficiary: m.member,
          status: index === 0 ? "active" : "pending",
          startDate: index === 0 ? new Date() : null,
        })
      )
    );

    return rounds;
  }

  async completeCurrentRound(groupId) {
    const activeRound = await this.contribRepo.findActiveByGroup(groupId);
    if (!activeRound) throw new Error("No active round found");

    const payments = await this.paymentRepo.findByGroup(groupId);
    const pending = payments.filter((p) => p.status !== "succeeded");
    if (pending.length > 0) throw new Error("Not all payments completed");
    await this.contribRepo.markCompleted(activeRound._id);
    const allRounds = await this.contribRepo.findByGroup(groupId);
    const nextRound = allRounds.find(
      (r) => r.roundNumber === activeRound.roundNumber + 1
    );
    if (nextRound) await this.contribRepo.updateStatus(nextRound._id, "active");
    return { message: "Round completed successfully" };
  }
  async listGroupRounds(groupId) {
    return this.contribRepo.findByGroup(groupId);
  }
}

export default new ContributionService(
  contributionRepository,
  GroupRepository,
  ReliabilityService,
  PaymentRepository
);
