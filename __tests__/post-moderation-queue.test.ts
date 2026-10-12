const mockPostModerationTask = {
  findMany: jest.fn(),
  updateMany: jest.fn(),
  findUnique: jest.fn(),
  update: jest.fn(),
};
const mockPost = {
  findUnique: jest.fn(),
  updateMany: jest.fn(),
};
const mockPostTaskUpdate = jest.fn();
const mockTransaction = jest.fn();
const mockCreateNotification = jest.fn();
const mockModerate = jest.fn();

jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    postModerationTask: mockPostModerationTask,
    post: mockPost,
    $transaction: mockTransaction,
  },
}));

jest.mock("@/lib/notificationBus", () => ({
  createNotification: mockCreateNotification,
}));

jest.mock("@/lib/postModeration", () => ({
  moderatePostContent: mockModerate,
}));

import { postModerationHash, postModerationText, processPostModerationQueue } from "@/lib/postModerationQueue";

describe("post moderation queue worker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("claims, approves, completes, and notifies without blocking submission", async () => {
    const post = {
      id: "post-1",
      title: "Retail assistant",
      description: "Evening shifts available.",
      location: "Tunis",
      fields: ["Retail"],
      updatedAt: new Date("2026-10-01T12:00:00.000Z"),
    };
    const content = postModerationText(post);
    mockPostModerationTask.findMany.mockResolvedValue([{ id: "task-1" }]);
    mockPostModerationTask.updateMany.mockResolvedValue({ count: 1 });
    mockPostModerationTask.findUnique.mockResolvedValue({
      id: "task-1",
      postId: post.id,
      contentHash: postModerationHash(content),
      attempts: 1,
      post: { ...post, recruiter: { userId: "recruiter-user" } },
    });
    mockPost.findUnique.mockResolvedValue(post);
    mockPost.updateMany.mockResolvedValue({ count: 1 });
    mockPostModerationTask.update.mockImplementation(mockPostTaskUpdate);
    mockTransaction.mockImplementation((callback: (tx: unknown) => Promise<unknown>) => callback({
      post: { updateMany: mockPost.updateMany },
      postModerationTask: { update: mockPostModerationTask.update },
    }));
    mockModerate.mockResolvedValue({ inappropriate: false, reason: null });

    await processPostModerationQueue();

    expect(mockPostModerationTask.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: "task-1", status: "QUEUED" }),
    }));
    expect(mockModerate).toHaveBeenCalledWith(content);
    expect(mockPost.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: post.id, updatedAt: post.updatedAt }),
      data: expect.objectContaining({ status: "APPROVED" }),
    }));
    expect(mockPostModerationTask.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "task-1" },
      data: expect.objectContaining({ status: "COMPLETED" }),
    }));
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.anything(), "recruiter-user", expect.objectContaining({
      status: "APPROVED",
      postId: post.id,
    }));
  });
});