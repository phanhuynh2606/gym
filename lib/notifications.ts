import "server-only";

import { connectMongoDB } from "@/lib/mongodb";
import {
  NotificationModel,
  type NotificationDocument,
} from "@/models/Notification";

export type NotificationType =
  | "reminder_workout"
  | "reminder_todo"
  | "reminder_metrics"
  | "streak_milestone"
  | "monthly_review_ready"
  | "achievement_unlocked"
  | "challenge_completed"
  | "system";

export type NotificationView = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
};

function serialize(doc: NotificationDocument): NotificationView {
  return {
    id: doc._id.toString(),
    type: doc.type as NotificationType,
    title: doc.title,
    body: doc.body,
    href: doc.href ?? null,
    read: Boolean(doc.read),
    createdAt: doc.createdAt.toISOString(),
    readAt: doc.readAt ? new Date(doc.readAt).toISOString() : null,
  };
}

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  /**
   * If provided, an upsert on `(userId, dedupeKey)` is used so that re-running
   * the reminder cron for the same day does not flood the inbox.
   */
  dedupeKey?: string;
};

/**
 * Persist a notification. Returns the upserted document. If `dedupeKey` is
 * supplied and a row already exists, the existing row is returned untouched.
 *
 * Atomic via `findOneAndUpdate` + `$setOnInsert` so two concurrent callers
 * (e.g. the hourly cron and a manual `?force=1` retry) can never both
 * insert and trip the unique index — one of them gets a no-op + `created:
 * false` instead of throwing E11000.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<{ doc: NotificationDocument; created: boolean }> {
  await connectMongoDB();

  if (input.dedupeKey) {
    const result = await NotificationModel.findOneAndUpdate(
      { userId: input.userId, dedupeKey: input.dedupeKey },
      {
        $setOnInsert: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href ?? undefined,
          dedupeKey: input.dedupeKey,
          read: false,
        },
      },
      { upsert: true, new: true, includeResultMetadata: true },
    );
    if (!result.value) {
      // includeResultMetadata + upsert + new:true always returns a doc; this
      // branch is unreachable but keeps the types honest.
      throw new Error("createNotification: upsert returned no document");
    }
    return {
      doc: result.value as NotificationDocument,
      created: Boolean(result.lastErrorObject?.upserted),
    };
  }

  const doc = await NotificationModel.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href ?? undefined,
    read: false,
  });
  return { doc, created: true };
}

export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<NotificationView[]> {
  await connectMongoDB();
  const docs = await NotificationModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return docs.map(serialize);
}

export async function countUnread(userId: string): Promise<number> {
  await connectMongoDB();
  return NotificationModel.countDocuments({ userId, read: false });
}

export async function markRead(
  userId: string,
  notificationId: string,
): Promise<{ ok: boolean }> {
  await connectMongoDB();
  const res = await NotificationModel.updateOne(
    { _id: notificationId, userId },
    { $set: { read: true, readAt: new Date() } },
  );
  return { ok: res.matchedCount > 0 };
}

export async function markAllRead(userId: string): Promise<{ updated: number }> {
  await connectMongoDB();
  const res = await NotificationModel.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } },
  );
  return { updated: res.modifiedCount };
}

export async function markEmailSent(notificationId: string): Promise<void> {
  await connectMongoDB();
  await NotificationModel.updateOne(
    { _id: notificationId },
    { $set: { emailSent: true } },
  );
}
