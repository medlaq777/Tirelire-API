import controller from "../../src/controllers/payment.controller.js";
import PaymentService from "../../src/services/payment.service.js";

jest.mock("../../src/services/payment.service.js");
const mockService = PaymentService;

jest.mock("../../src/config/config.js", () => ({
  stripeSecret: "sk_test",
  stripeWebhookSecret: "whsec_test",
}));

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({ id: "evt_1" }),
    },
  }));
});

describe("PaymentController", () => {
  let req, res, next;
  beforeEach(() => {
    req = {
      body: {},
      user: { id: "u1" },
      headers: { "stripe-signature": "sig" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    mockService.createPaymentIntent.mockReset();
    mockService.handleWebhook.mockReset();
  });

  it("createIntent: should return 201 and result", async () => {
    const result = { id: 1 };
    mockService.createPaymentIntent.mockResolvedValue(result);
    req.body = { groupId: "g1", amount: 10 };
    await controller.createIntent(req, res, next);
    expect(mockService.createPaymentIntent).toHaveBeenCalledWith({
      groupId: "g1",
      userId: "u1",
      amount: 10,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("createIntent: should call next on error", async () => {
    mockService.createPaymentIntent.mockRejectedValue(new Error("fail"));
    await controller.createIntent(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("webhook: should handle event and return received", async () => {
    mockService.handleWebhook.mockResolvedValue();
    await controller.webhook(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("webhook: should return 400 on error", async () => {
    mockService.handleWebhook.mockRejectedValue(new Error("fail"));
    await controller.webhook(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalled();
  });
});
