import Ticket from "../models/ticket.model.js";

class TicketRepository {
  async create(data) {
    return new Ticket(data).save();
  }

  async findAll() {
    return Ticket.find().populate("group user").exec();
  }

  async findByUser(userId) {
    return Ticket.find({ user: userId }).exec();
  }

  async updateStatus(ticketId, status) {
    return Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });
  }
}

export default new TicketRepository();
