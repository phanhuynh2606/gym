"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { connectMongoDB } from "@/lib/mongodb";
import { markAllRead, markRead } from "@/lib/notifications";
import { UserModel } from "@/models/User";

export type MarkResult = { ok: true } | { ok: false; error: string };

// 24-char hex (Mongo ObjectId). Guarding here means `markRead` can pass the
// id straight to `updateOne({ _id })` without Mongoose throwing CastError
// when a caller fabricates an arbitrary string via direct server-action call.
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export async function markNotificationRead(
  notificationId: string,
): Promise<MarkResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Chưa đăng nhập." };
  if (
    !notificationId ||
    typeof notificationId !== "string" ||
    !OBJECT_ID_RE.test(notificationId)
  ) {
    return { ok: false, error: "ID thông báo không hợp lệ." };
  }
  const result = await markRead(userId, notificationId);
  if (!result.ok) return { ok: false, error: "Không tìm thấy thông báo." };

  revalidatePath("/thong-bao");
  revalidatePath("/hom-nay");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<MarkResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Chưa đăng nhập." };
  await markAllRead(userId);
  revalidatePath("/thong-bao");
  revalidatePath("/hom-nay");
  return { ok: true };
}

export type ReminderPreferences = {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderEmailEnabled: boolean;
  timezoneOffsetMinutes: number;
};

export type UpdatePreferencesResult =
  | { ok: true; preferences: ReminderPreferences }
  | { ok: false; error: string };

function sanitizeHour(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const hour = Math.trunc(value);
  if (hour < 0 || hour > 23) return null;
  return hour;
}

function sanitizeTimezone(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const tz = Math.trunc(value);
  // JS getTimezoneOffset() returns minutes between -840 and +720.
  if (tz < -840 || tz > 840) return null;
  return tz;
}

export async function updateReminderPreferences(
  input: Partial<ReminderPreferences>,
): Promise<UpdatePreferencesResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Chưa đăng nhập." };

  const update: Record<string, unknown> = {};
  if (typeof input.reminderEnabled === "boolean") {
    update.reminderEnabled = input.reminderEnabled;
  }
  if (input.reminderHour !== undefined) {
    const hour = sanitizeHour(input.reminderHour);
    if (hour === null) return { ok: false, error: "Giờ nhắc không hợp lệ." };
    update.reminderHour = hour;
  }
  if (typeof input.reminderEmailEnabled === "boolean") {
    update.reminderEmailEnabled = input.reminderEmailEnabled;
  }
  if (input.timezoneOffsetMinutes !== undefined) {
    const tz = sanitizeTimezone(input.timezoneOffsetMinutes);
    if (tz === null) return { ok: false, error: "Múi giờ không hợp lệ." };
    update.timezoneOffsetMinutes = tz;
  }

  if (Object.keys(update).length === 0) {
    return { ok: false, error: "Không có thay đổi nào." };
  }

  await connectMongoDB();
  const doc = await UserModel.findOneAndUpdate(
    { clerkId: userId },
    { $set: update },
    { new: true },
  );
  if (!doc) return { ok: false, error: "Không tìm thấy người dùng." };

  revalidatePath("/cai-dat");
  revalidatePath("/thong-bao");
  return {
    ok: true,
    preferences: {
      reminderEnabled: doc.reminderEnabled ?? true,
      reminderHour:
        typeof doc.reminderHour === "number" ? doc.reminderHour : 18,
      reminderEmailEnabled: doc.reminderEmailEnabled ?? false,
      timezoneOffsetMinutes:
        typeof doc.timezoneOffsetMinutes === "number"
          ? doc.timezoneOffsetMinutes
          : 420,
    },
  };
}
