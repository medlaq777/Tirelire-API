import TicketService from "../services/ticket.service.js";

class TicketController {
  async create(req, res, next) {
    try {
      const user = req.user.id;
      const { group, subject, message } = req.body;
      const ticket = await TicketService.createTicket({
        user,
        group,
        subject,
        message,
      });
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  }

  async listUser(req, res, next) {
    try {
      const user = req.user.id;
      const tickets = await TicketService.listUserTickets(user);
      res.json(tickets);
    } catch (err) {
      next(err);
    }
  }

  async listAll(req, res, next) {
    try {
      const ticket = await TicketService.listAllTickets();
      res.json(ticket);
    } catch (err) {
      next(err);
    }
  }

  async resolve(req, res, next) {
    try {
      const { ticketId } = req.parms;
      const { status } = req.body;
      const result = await TicketService.resolveTicket(
        ticketId,
        req.user.id,
        status
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

export default new TicketController();
