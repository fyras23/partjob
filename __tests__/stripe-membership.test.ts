const mockRecruiterProfile = {
  findUnique: jest.fn(),
  updateMany: jest.fn(),
};
const mockCreateNotification = jest.fn();

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { recruiterProfile: mockRecruiterProfile },
}));

jest.mock("@/lib/notificationBus", () => ({
  createNotification: mockCreateNotification,
}));

import type Stripe from "stripe";
import { activateMembershipFromCheckout } from "@/lib/stripeMembership";

function checkout(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_123",
    status: "complete",
    payment_status: "paid",
    mode: "payment",
    customer: "cus_test_123",
    created: 1_791_244_800,
    metadata: { recruiterId: "recruiter-1", plan: "MONTHLY", months: "1" },
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

function profile(overrides: Record<string, unknown> = {}) {
  return {
    id: "recruiter-1",
    stripeCustomerId: "cus_test_123",
    stripeSubscriptionId: null,
    subscriptionStatus: "INACTIVE",
    subscriptionEnd: null,
    user: { id: "user-1", name: "Recruiter" },
    ...overrides,
  };
}

describe("Stripe membership activation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateNotification.mockResolvedValue({ id: "notification-1" });
  });

  it("does not activate a session until Stripe confirms payment", async () => {
    const result = await activateMembershipFromCheckout(
      checkout({ payment_status: "unpaid" }),
    );

    expect(result).toEqual({ status: "PENDING" });
    expect(mockRecruiterProfile.findUnique).not.toHaveBeenCalled();
    expect(mockRecruiterProfile.updateMany).not.toHaveBeenCalled();
  });

  it("activates the matching recruiter and sends one notification", async () => {
    mockRecruiterProfile.findUnique.mockResolvedValue(profile());
    mockRecruiterProfile.updateMany.mockResolvedValue({ count: 1 });

    const result = await activateMembershipFromCheckout(checkout());

    expect(result.status).toBe("ACTIVE");
    expect(mockRecruiterProfile.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "recruiter-1", stripeSubscriptionId: null },
      data: expect.objectContaining({
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: "MONTHLY",
        stripeSubscriptionId: "cs_test_123",
      }),
    }));
    expect(mockCreateNotification).toHaveBeenCalledTimes(1);
  });

  it("does not extend or notify again when the same session is processed twice", async () => {
    const existingEnd = new Date("2026-11-01T00:00:00.000Z");
    mockRecruiterProfile.findUnique.mockResolvedValue(profile({
      stripeSubscriptionId: "cs_test_123",
      subscriptionStatus: "ACTIVE",
      subscriptionEnd: existingEnd,
    }));

    const result = await activateMembershipFromCheckout(checkout());

    expect(result).toEqual({
      status: "ACTIVE",
      subscriptionEnd: existingEnd,
      alreadyActive: true,
    });
    expect(mockRecruiterProfile.updateMany).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("ignores an older paid checkout arriving after a newer membership is active", async () => {
    const newerEnd = new Date("2027-10-12T00:00:00.000Z");
    mockRecruiterProfile.findUnique.mockResolvedValue(profile({
      stripeSubscriptionId: "cs_newer_session",
      subscriptionStatus: "ACTIVE",
      subscriptionEnd: newerEnd,
    }));

    const result = await activateMembershipFromCheckout(checkout({
      created: 1_791_244_800,
    }));

    expect(result).toEqual({ status: "ACTIVE", subscriptionEnd: newerEnd, alreadyActive: true });
    expect(mockRecruiterProfile.updateMany).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("rejects a checkout session owned by a different Stripe customer", async () => {
    mockRecruiterProfile.findUnique.mockResolvedValue(profile());

    await expect(activateMembershipFromCheckout(checkout({ customer: "cus_other" })))
      .rejects.toThrow("Checkout customer does not match the recruiter account");
    expect(mockRecruiterProfile.updateMany).not.toHaveBeenCalled();
  });
});