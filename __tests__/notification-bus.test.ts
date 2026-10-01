import type { PrismaClient } from "@prisma/client";
import { createNotification, pushToAllAdmins, subscribers } from "@/lib/notificationBus";

describe("notification delivery", () => {
  it("persists an offline user's notification", async () => {
    const create = jest.fn().mockResolvedValue({
      id: "notification-1",
      createdAt: new Date("2026-09-30T12:00:00.000Z"),
    });
    const prisma = { notification: { create } } as unknown as PrismaClient;

    await createNotification(prisma, "offline-user", {
      type: "APPLICATION_UPDATE",
      status: "PENDING",
      title: "Application submitted",
      message: "Your application was sent.",
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "offline-user",
        type: "APPLICATION_UPDATE",
        title: "Application submitted",
      }),
    });
  });

  it("persists and streams a notification to connected clients", async () => {
    const create = jest.fn().mockResolvedValue({
      id: "notification-2",
      createdAt: new Date("2026-09-30T12:00:00.000Z"),
    });
    const prisma = { notification: { create } } as unknown as PrismaClient;
    const chunks: Uint8Array[] = [];
    const controller = {
      enqueue: (chunk: Uint8Array) => chunks.push(chunk),
    } as unknown as ReadableStreamDefaultController;
    subscribers.set("connected-user", new Set([controller]));

    try {
      await createNotification(prisma, "connected-user", {
        type: "NEW_MESSAGE",
        status: "PENDING",
        title: "New message",
        message: "Hello",
      });

      expect(chunks).toHaveLength(1);
      expect(new TextDecoder().decode(chunks[0])).toContain('"id":"notification-2"');
    } finally {
      subscribers.delete("connected-user");
    }
  });

  it("persists a broadcast notification for every admin", async () => {
    const create = jest.fn().mockResolvedValue({
      id: "admin-notification",
      createdAt: new Date("2026-09-30T12:00:00.000Z"),
    });
    const findMany = jest.fn().mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }]);
    const prisma = {
      notification: { create },
      user: { findMany },
    } as unknown as PrismaClient;

    await pushToAllAdmins(prisma, {
      type: "NEW_POST",
      status: "PENDING",
      title: "Post appeal",
      message: "Review requested.",
    });

    expect(findMany).toHaveBeenCalledWith({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    expect(create).toHaveBeenCalledTimes(2);
  });
});