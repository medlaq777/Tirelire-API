import TicketRepository from "../repositories/ticket.repository.js";

class TicketService {
  constructor(repo) {
    this.repo = repo;
  }

  async createTicket({ user, group, subject, message }) {
    if (!subject || !message) {
      const err = new Error("Subject and message are required");
      err.status(400);
      throw err;
    }

    return this.repo.create({ user, group, subject, message });
  }

  async resolveTicket(ticketId, adminId, status = "resolved") {
    return this.repo.updateStatus(ticketId, status);
  }

  async listUserTickets(userId) {
    return this.repo.findByUser(userId);
  }

  async listAllTickets() {
    return this.repo.findAll();
  }
}
export default new TicketService(TicketRepository);
