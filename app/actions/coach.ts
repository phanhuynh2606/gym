"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { askCoach, type CoachTurn } from "@/lib/coach";
import { connectMongoDB } from "@/lib/mongodb";
import { getOrCreateMongoUser } from "@/lib/users";
import { CoachMessageModel } from "@/models/CoachMessage";

const MessageInputSchema = z
  .string()
  .trim()
  .min(1, "Nhập câu hỏi trước khi gửi.")
  .max(2000, "Câu hỏi quá dài (tối đa 2000 ký tự).");

export type CoachSendResult =
  | {
      ok: true;
      reply: string;
      source: "llm" | "fallback";
      model: string | null;
    }
  | { ok: false; error: string };

/**
 * Append a user message to history, generate a reply, persist both rows.
 * Returns the assistant reply so the client can render optimistic state.
 */
export async function sendCoachMessage(
  rawMessage: string,
): Promise<CoachSendResult> {
  const parsed = MessageInputSchema.safeParse(rawMessage);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Câu hỏi không hợp lệ." };
  }
  const userMessage = parsed.data;

  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập để dùng coach." };
  }

  await connectMongoDB();

  // Replay the last 10 turns so the model has short-term memory but we don't
  // blow the context window.
  const recentDocs = await CoachMessageModel.find({ userId: user.clerkId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  const history: CoachTurn[] = recentDocs
    .reverse()
    .filter((d) => d.role === "user" || d.role === "assistant")
    .map((d) => ({
      role: d.role as "user" | "assistant",
      content: d.content,
    }));

  const result = await askCoach({ user, userMessage, history });

  await CoachMessageModel.create([
    {
      userId: user.clerkId,
      role: "user",
      content: userMessage,
      source: "user",
    },
    {
      userId: user.clerkId,
      role: "assistant",
      content: result.reply,
      source: result.source,
      model: result.model ?? undefined,
    },
  ]);

  revalidatePath("/coach");

  return {
    ok: true,
    reply: result.reply,
    source: result.source,
    model: result.model,
  };
}

export async function clearCoachHistory(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const user = await getOrCreateMongoUser();
  if (!user) {
    return { ok: false, error: "Bạn cần đăng nhập." };
  }
  await connectMongoDB();
  await CoachMessageModel.deleteMany({ userId: user.clerkId });
  revalidatePath("/coach");
  return { ok: true };
}
