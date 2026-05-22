import "server-only";

import {
  buildCoachContext,
  renderContextAsParagraph,
  type CoachContext,
} from "@/lib/coach-context";
import { generateFallbackReply, type FallbackTopic } from "@/lib/coach-fallback";
import type { MongoUser } from "@/lib/users";

export type CoachTurn = { role: "user" | "assistant"; content: string };

export type CoachReply = {
  reply: string;
  source: "llm" | "fallback";
  model: string | null;
  topic: FallbackTopic | null;
  context: CoachContext;
};

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const DEFAULT_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

/**
 * Whether the orchestrator should attempt an LLM call. We require a non-empty
 * API key — model + base URL fall back to OpenAI defaults.
 */
export function isLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 0);
}

function buildSystemPrompt(context: CoachContext): string {
  return [
    "Bạn là một huấn luyện viên gym người Việt, tư vấn dựa trên dữ liệu thật của user.",
    "Trả lời ngắn gọn (3-6 câu hoặc bullet list), bằng tiếng Việt, giọng thân thiện nhưng chuyên nghiệp.",
    "KHÔNG hứa hẹn quá mức (\"sẽ giảm 10kg trong 1 tuần\"). KHÔNG đưa ra lời khuyên y tế ngoài phạm vi thể dục.",
    "Nếu user nói đau / chấn thương: đưa nguyên tắc R.I.C.E. + khuyên gặp bác sĩ thể thao nếu kéo dài.",
    "Khi đề xuất bài tập, link sang /bai-tap/<slug> hoặc /nhom-co/<muscle> nếu phù hợp.",
    "Khi đề xuất giáo án, link sang /giao-an/<slug>.",
    "",
    "Hồ sơ user:",
    renderContextAsParagraph(context),
  ].join("\n");
}

type OpenAIChatMessage = { role: "system" | "user" | "assistant"; content: string };

type OpenAIChatChoice = {
  index: number;
  message: OpenAIChatMessage;
  finish_reason: string;
};

type OpenAIChatResponse = {
  choices: OpenAIChatChoice[];
  model: string;
};

/**
 * Calls an OpenAI-compatible chat completions endpoint. Supports any provider
 * that implements the same wire format (OpenAI, OpenRouter, Groq, Together,
 * Ollama with `--openai`, etc.) via `OPENAI_BASE_URL`.
 *
 * Throws on transport / parse errors; caller is responsible for catching and
 * falling back to the rule-based engine.
 */
async function callOpenAI(
  messages: OpenAIChatMessage[],
): Promise<{ reply: string; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  const res = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as OpenAIChatResponse;
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("LLM returned empty response");
  return { reply, model: data.model ?? DEFAULT_MODEL };
}

/**
 * Generates a coach reply for the given user message. Always returns
 * something — falls back to the rule-based engine if no API key is set or if
 * the LLM call fails. Build context once and pass it back so the caller can
 * show progress stats in the sidebar without re-querying Mongo.
 */
export async function askCoach({
  user,
  userMessage,
  history,
}: {
  user: MongoUser;
  userMessage: string;
  history: CoachTurn[];
}): Promise<CoachReply> {
  const context = await buildCoachContext(user);

  if (isLlmConfigured()) {
    try {
      const messages: OpenAIChatMessage[] = [
        { role: "system", content: buildSystemPrompt(context) },
        ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: userMessage },
      ];
      const { reply, model } = await callOpenAI(messages);
      return { reply, source: "llm", model, topic: null, context };
    } catch (err) {
      // Swallow + log so the user still gets a useful reply via the fallback
      // engine instead of an opaque "Something went wrong" alert.
      console.error("[coach] LLM call failed, falling back:", err);
    }
  }

  const fallback = await generateFallbackReply(userMessage, context);
  return {
    reply: fallback.reply,
    source: "fallback",
    model: null,
    topic: fallback.topic,
    context,
  };
}
