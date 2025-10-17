import controller from "../../controllers/ticket.controller.js";
import TicketService from "../../services/ticket.service.js";

jest.mock("../../services/ticket.service.js");
const mockService = TicketService;

describe("TicketController", () => {
  let req, res, next;
  beforeEach(() => {
    req = { body: {}, params: {}, user: { id: "u1" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
    mockService.createTicket.mockReset();
    mockService.listUserTickets.mockReset();
    mockService.listAllTickets.mockReset();
    mockService.resolveTicket.mockReset();
  });

  it("create: should return 201 and ticket", async () => {
    const ticket = { id: 1 };
    mockService.createTicket.mockResolvedValue(ticket);
    req.body = { group: "g", subject: "s", message: "m" };
    await controller.create(req, res, next);
    expect(mockService.createTicket).toHaveBeenCalledWith({
      user: "u1",
      group: "g",
      subject: "s",
      message: "m",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(ticket);
  });

  it("create: should call next on error", async () => {
    mockService.createTicket.mockRejectedValue(new Error("fail"));
    await controller.create(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("listUser: should return tickets", async () => {
    const tickets = [1, 2];
    mockService.listUserTickets.mockResolvedValue(tickets);
    await controller.listUser(req, res, next);
    expect(mockService.listUserTickets).toHaveBeenCalledWith("u1");
    expect(res.json).toHaveBeenCalledWith(tickets);
  });

  it("listUser: should call next on error", async () => {
    mockService.listUserTickets.mockRejectedValue(new Error("fail"));
    await controller.listUser(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("listAll: should return all tickets", async () => {
    const tickets = [1, 2];
    mockService.listAllTickets.mockResolvedValue(tickets);
    await controller.listAll(req, res, next);
    expect(mockService.listAllTickets).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(tickets);
  });

  it("listAll: should call next on error", async () => {
    mockService.listAllTickets.mockRejectedValue(new Error("fail"));
    await controller.listAll(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("resolve: should return result", async () => {
    const result = { resolved: true };
    mockService.resolveTicket.mockResolvedValue(result);
    req.body = { ticketId: "t1", status: "closed" };
    await controller.resolve(req, res, next);
    expect(mockService.resolveTicket).toHaveBeenCalledWith(
      "t1",
      "u1",
      "closed"
    );
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("resolve: should call next on error", async () => {
    mockService.resolveTicket.mockRejectedValue(new Error("fail"));
    req.body = { ticketId: "t1", status: "closed" };
    await controller.resolve(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
