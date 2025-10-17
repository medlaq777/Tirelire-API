jest.mock("stripe", () => {
  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
    },
  };

  globalThis.mockStripe = mockStripe;

  const StripeMock = jest.fn(() => mockStripe);

  return StripeMock;
});

jest.mock("../../config/config.js", () => ({
  stripeSecret: "mock_stripe_secret_key",
}));

import { PaymentService } from "../../services/payment.service.js";

const mockReliabilityService = {
  updateScore: jest.fn(),
};

const mockPaymentRepo = {
  create: jest.fn(),
  findByStripId: jest.fn(),
  findByStripeId: jest.fn(),
  updateStatus: jest.fn(),
};

const mockGroupRepo = {
  findById: jest.fn(),
};

let paymentService;
const mockGroupId = "group-101";
const mockUserId = "user-789";
const mockAmount = 25.5;
const mockStripePaymentIntentId = "pi_mock_12345";
const mockClientSecret = "cs_mock_secret_key";
const mockPaymentId = "payment_id_abc";

const mockGroup = { _id: mockGroupId, name: "Test Group" };
const mockPaymentIntentCreation = {
  id: mockStripePaymentIntentId,
  client_secret: mockClientSecret,
};
const mockPaymentRecord = {
  _id: mockPaymentId,
  group: mockGroupId,
  member: mockUserId,
  amount: mockAmount,
  stripePaymentId: mockStripePaymentIntentId,
  status: "pending",
};

beforeEach(() => {
  jest.clearAllMocks();

  globalThis.ReliabilityService = mockReliabilityService;

  paymentService = new PaymentService(mockPaymentRepo, mockGroupRepo);
});

describe("PaymentService.createPaymentIntent", () => {
  const paymentIntentArgs = {
    groupId: mockGroupId,
    userId: mockUserId,
    amount: mockAmount,
  };

  it("should throw a 404 error if the group is not found", async () => {
    mockGroupRepo.findById.mockResolvedValue(null);

    await expect(
      paymentService.createPaymentIntent(paymentIntentArgs)
    ).rejects.toMatchObject({
      status: 404,
      message: "Group not found",
    });

    expect(globalThis.mockStripe.paymentIntents.create).not.toHaveBeenCalled();
    expect(mockPaymentRepo.create).not.toHaveBeenCalled();
  });

  it("should successfully create a Stripe PaymentIntent and a local payment record", async () => {
    mockGroupRepo.findById.mockResolvedValue(mockGroup);
    globalThis.mockStripe.paymentIntents.create.mockResolvedValue(
      mockPaymentIntentCreation
    );
    mockPaymentRepo.create.mockResolvedValue(mockPaymentRecord);

    const result = await paymentService.createPaymentIntent(paymentIntentArgs);

    expect(globalThis.mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: Math.round(mockAmount * 100),
      currency: "usd",
      metadata: { groupId: mockGroupId, userId: mockUserId },
    });

    expect(mockPaymentRepo.create).toHaveBeenCalledWith({
      group: mockGroupId,
      member: mockUserId,
      amount: mockAmount,
      stripePaymentId: mockStripePaymentIntentId,
    });

    expect(result).toEqual({
      clientSecret: mockClientSecret,
      payment: mockPaymentRecord,
    });
  });
});

describe("PaymentService.handleWebhook", () => {
  it("should handle 'payment_intent.succeeded' event correctly", async () => {
    const successfulEvent = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: mockStripePaymentIntentId,

          payment_intent: mockStripePaymentIntentId,
          metadata: { userId: mockUserId },
        },
      },
    };

    mockPaymentRepo.findByStripId.mockResolvedValue(mockPaymentRecord);

    await paymentService.handleWebhook(successfulEvent);

    expect(mockReliabilityService.updateScore).toHaveBeenCalledWith(
      mockUserId,
      "success"
    );

    expect(mockPaymentRepo.findByStripId).toHaveBeenCalledWith(
      mockStripePaymentIntentId
    );
    expect(mockPaymentRepo.updateStatus).toHaveBeenCalledWith(
      mockPaymentId,
      "succeeded"
    );
  });

  it("should handle 'payment_intent.payment_failed' event correctly", async () => {
    const failedEvent = {
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: mockStripePaymentIntentId,
          metadata: { userId: mockUserId },
        },
      },
    };
    const mockFailedPayment = { ...mockPaymentRecord, status: "pending" };

    mockPaymentRepo.findByStripeId.mockResolvedValue(mockFailedPayment);

    await paymentService.handleWebhook(failedEvent);

    expect(mockReliabilityService.updateScore).toHaveBeenCalledWith(
      mockUserId,
      "fail"
    );

    expect(mockPaymentRepo.findByStripeId).toHaveBeenCalledWith(
      mockStripePaymentIntentId
    );
    expect(mockPaymentRepo.updateStatus).toHaveBeenCalledWith(
      mockPaymentId,
      "failed"
    );
  });

  it("should do nothing for unhandled event types", async () => {
    const unhandledEvent = {
      type: "charge.refunded",
      data: { object: { id: "ch_refunded_123" } },
    };
    await paymentService.handleWebhook(unhandledEvent);
    expect(mockReliabilityService.updateScore).not.toHaveBeenCalled();
    expect(mockPaymentRepo.findByStripId).not.toHaveBeenCalled();
    expect(mockPaymentRepo.findByStripeId).not.toHaveBeenCalled();
    expect(mockPaymentRepo.updateStatus).not.toHaveBeenCalled();
  });
});

describe("PaymentService.handleWebhook edge cases", () => {
  it("should handle 'payment_intent.succeeded' when payment is not found", async () => {
    const successfulEvent = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: mockStripePaymentIntentId,
          payment_intent: mockStripePaymentIntentId,
          metadata: { userId: mockUserId },
        },
      },
    };
    mockPaymentRepo.findByStripId.mockResolvedValue(null);
    await paymentService.handleWebhook(successfulEvent);
    expect(mockPaymentRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("should handle 'payment_intent.payment_failed' when payment is not found", async () => {
    const failedEvent = {
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: mockStripePaymentIntentId,
          metadata: { userId: mockUserId },
        },
      },
    };
    mockPaymentRepo.findByStripeId.mockResolvedValue(null);
    await paymentService.handleWebhook(failedEvent);
    expect(mockPaymentRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("should handle webhook when event.data is missing", async () => {
    const event = { type: "payment_intent.succeeded" };
    await expect(paymentService.handleWebhook(event)).resolves.toBeUndefined();
    expect(mockPaymentRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("should handle webhook when event.data.object is missing", async () => {
    const event = { type: "payment_intent.succeeded", data: {} };
    await expect(paymentService.handleWebhook(event)).resolves.toBeUndefined();
    expect(mockPaymentRepo.updateStatus).not.toHaveBeenCalled();
  });
});

describe("PaymentService constructor", () => {
  it("sets paymentRepo and groupRepo instances", () => {
    const paymentRepo = {};
    const groupRepo = {};
    const service = new PaymentService(paymentRepo, groupRepo);
    expect(service.paymentRepo).toBe(paymentRepo);
    expect(service.groupRepo).toBe(groupRepo);
    expect(service.stripe).toBeDefined();
  });
});

describe("PaymentService edge cases", () => {
  it("createPaymentIntent throws if groupId is missing", async () => {
    await expect(
      paymentService.createPaymentIntent({
        userId: mockUserId,
        amount: mockAmount,
      })
    ).rejects.toThrow();
  });

  it("createPaymentIntent throws if userId is missing", async () => {
    mockGroupRepo.findById.mockResolvedValue(mockGroup);
    await expect(
      paymentService.createPaymentIntent({
        groupId: mockGroupId,
        amount: mockAmount,
      })
    ).rejects.toThrow();
  });

  it("createPaymentIntent throws if amount is missing", async () => {
    mockGroupRepo.findById.mockResolvedValue(mockGroup);
    await expect(
      paymentService.createPaymentIntent({
        groupId: mockGroupId,
        userId: mockUserId,
      })
    ).rejects.toThrow();
  });

  it("handleWebhook does nothing if event is missing type", async () => {
    await paymentService.handleWebhook({ data: {} });
    expect(mockReliabilityService.updateScore).not.toHaveBeenCalled();
  });

  it("handleWebhook does nothing if event is undefined", async () => {
    await paymentService.handleWebhook(undefined);
    expect(mockReliabilityService.updateScore).not.toHaveBeenCalled();
  });
});
