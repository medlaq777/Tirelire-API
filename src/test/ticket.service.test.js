import { TicketService } from "../services/ticket.service.js";
const mockTicketRepo = {
  create: jest.fn(),
  updateStatus: jest.fn(),
  findByUser: jest.fn(),
  findAll: jest.fn(),
};

let ticketService;
const mockUserId = "user-abc";
const mockGroupId = "group-xyz";
const mockTicketId = "ticket-123";
const mockTicketData = {
  user: mockUserId,
  group: mockGroupId,
  subject: "Payment Issue",
  message: "My last contribution failed to process.",
};
const mockCreatedTicket = {
  _id: mockTicketId,
  ...mockTicketData,
  status: "open",
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  ticketService = new TicketService(mockTicketRepo);
});

describe("TicketService.createTicket", () => {
  it("should throw a 400 error if subject is missing", async () => {
    await expect(
      ticketService.createTicket({
        user: mockUserId,
        group: mockGroupId,
        message: mockTicketData.message,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "Subject and message are required",
    });
    expect(mockTicketRepo.create).not.toHaveBeenCalled();
  });

  it("should throw a 400 error if message is missing", async () => {
    await expect(
      ticketService.createTicket({
        user: mockUserId,
        group: mockGroupId,
        subject: mockTicketData.subject,
      })
    ).rejects.toMatchObject({
      status: 400,
      message: "Subject and message are required",
    });
    expect(mockTicketRepo.create).not.toHaveBeenCalled();
  });

  it("should successfully create a new ticket and return the result", async () => {
    mockTicketRepo.create.mockResolvedValue(mockCreatedTicket);
    const result = await ticketService.createTicket(mockTicketData);
    expect(mockTicketRepo.create).toHaveBeenCalledWith(mockTicketData);
    expect(result).toEqual(mockCreatedTicket);
  });
});

describe("TicketService.resolveTicket", () => {
  const mockAdminId = "admin-456";

  it("should call updateStatus with 'resolved' status by default", async () => {
    const mockResolvedTicket = { ...mockCreatedTicket, status: "resolved" };
    mockTicketRepo.updateStatus.mockResolvedValue(mockResolvedTicket);

    const result = await ticketService.resolveTicket(mockTicketId, mockAdminId);

    expect(mockTicketRepo.updateStatus).toHaveBeenCalledWith(
      mockTicketId,
      "resolved"
    );
    expect(result.status).toBe("resolved");
  });

  it("should allow a custom status to be passed", async () => {
    const customStatus = "closed";
    const mockClosedTicket = { ...mockCreatedTicket, status: customStatus };
    mockTicketRepo.updateStatus.mockResolvedValue(mockClosedTicket);

    const result = await ticketService.resolveTicket(
      mockTicketId,
      mockAdminId,
      customStatus
    );

    expect(mockTicketRepo.updateStatus).toHaveBeenCalledWith(
      mockTicketId,
      customStatus
    );
    expect(result.status).toBe(customStatus);
  });
});

describe("TicketService.listUserTickets", () => {
  it("should call findByUser with the correct userId and return tickets", async () => {
    const mockUserTickets = [
      mockCreatedTicket,
      { ...mockCreatedTicket, _id: "t2" },
    ];
    mockTicketRepo.findByUser.mockResolvedValue(mockUserTickets);

    const result = await ticketService.listUserTickets(mockUserId);

    expect(mockTicketRepo.findByUser).toHaveBeenCalledWith(mockUserId);
    expect(result).toEqual(mockUserTickets);
  });

  it("should return an empty array if no tickets are found for the user", async () => {
    mockTicketRepo.findByUser.mockResolvedValue([]);
    const result = await ticketService.listUserTickets(mockUserId);
    expect(result).toEqual([]);
  });
});

describe("TicketService.listAllTickets", () => {
  it("should call findAll and return all tickets", async () => {
    const mockAllTickets = [
      mockCreatedTicket,
      { ...mockCreatedTicket, _id: "t2", user: "user-def" },
    ];
    mockTicketRepo.findAll.mockResolvedValue(mockAllTickets);

    const result = await ticketService.listAllTickets();

    expect(mockTicketRepo.findAll).toHaveBeenCalled();
    expect(result).toEqual(mockAllTickets);
  });
});

describe("TicketService constructor", () => {
  it("sets repo instance", () => {
    const repo = {};
    const service = new TicketService(repo);
    expect(service.repo).toBe(repo);
  });
});

describe("TicketService edge cases", () => {
  it("createTicket throws if subject and message are missing", async () => {
    await expect(
      ticketService.createTicket({ user: mockUserId, group: mockGroupId })
    ).rejects.toMatchObject({
      status: 400,
      message: "Subject and message are required",
    });
  });

  it("listUserTickets returns undefined if repo returns undefined", async () => {
    mockTicketRepo.findByUser.mockResolvedValue(undefined);
    const result = await ticketService.listUserTickets(mockUserId);
    expect(result).toBeUndefined();
  });

  it("listAllTickets returns undefined if repo returns undefined", async () => {
    mockTicketRepo.findAll.mockResolvedValue(undefined);
    const result = await ticketService.listAllTickets();
    expect(result).toBeUndefined();
  });
});
