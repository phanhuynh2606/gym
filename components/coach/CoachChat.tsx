"use client";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { clearCoachHistory, sendCoachMessage } from "@/app/actions/coach";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachContext } from "@/lib/coach-context";
import { cn } from "@/lib/utils";

export type CoachChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source: "user" | "llm" | "fallback" | string;
  createdAt: string;
};

type Props = {
  history: CoachChatMessage[];
  starterPrompts: string[];
  llmConfigured: boolean;
  contextSummary: string;
  profile: CoachContext["profile"];
  progress: CoachContext["progress"];
  plan: CoachContext["plan"];
};

/**
 * Convert assistant markdown-lite (links + bullets) into JSX. We support
 * `[text](href)` links and lines starting with "•" / "-" as a list.
 */
function renderAssistantContent(content: string): React.ReactNode {
  const blocks = content.split(/\n\n+/).filter(Boolean);
  return blocks.map((block, bi) => {
    const lines = block.split("\n");
    const isList = lines.every((l) => /^(•|-)\s+/.test(l));
    if (isList) {
      return (
        <ul key={bi} className="my-1 list-disc space-y-1 pl-5">
          {lines.map((line, li) => (
            <li key={li}>{renderInline(line.replace(/^(•|-)\s+/, ""))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className="my-1 whitespace-pre-wrap">
        {lines.map((line, li) => (
          <span key={li}>
            {renderInline(line)}
            {li < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match either [label](href) or **bold** (greedy-safe)
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      parts.push(
        <Link
          key={`${match.index}-l`}
          href={match[2]}
          className="text-brand underline-offset-2 hover:underline"
        >
          {match[1]}
        </Link>,
      );
    } else if (match[3]) {
      parts.push(
        <strong key={`${match.index}-b`} className="font-semibold">
          {match[3]}
        </strong>,
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function CoachChat({
  history,
  starterPrompts,
  llmConfigured,
  contextSummary,
  profile,
  progress,
  plan,
}: Props) {
  const [messages, setMessages] = useState<CoachChatMessage[]>(history);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollerRef = useRef<HTMLDivElement>(null);
  // Stable id base for optimistic rows so React keys stay unique across
  // re-renders without calling `Date.now()` during render (impure).
  const idBase = useId();
  const optimisticCounter = useRef(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  function submit(content: string) {
    const value = content.trim();
    if (!value || pending) return;
    setError(null);

    const turn = ++optimisticCounter.current;
    const optimisticUserId = `${idBase}-user-${turn}`;
    const optimisticAsstId = `${idBase}-asst-${turn}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticUserId,
        role: "user",
        content: value,
        source: "user",
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");

    startTransition(async () => {
      const result = await sendCoachMessage(value);
      if (!result.ok) {
        setError(result.error);
        // Roll back the optimistic user message so they can retry the input.
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserId));
        setInput(value);
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticAsstId,
          role: "assistant",
          content: result.reply,
          source: result.source,
          createdAt: new Date().toISOString(),
        },
      ]);
    });
  }

  function onClear() {
    if (pending) return;
    if (!confirm("Xoá toàn bộ lịch sử chat với coach?")) return;
    startTransition(async () => {
      const result = await clearCoachHistory();
      if (result.ok) {
        setMessages([]);
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="container-app grid gap-6 py-6 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-[70vh] flex-col">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Sparkles className="h-5 w-5 text-brand" aria-hidden />
              HLV AI
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Hỏi gì về tập, dinh dưỡng, chấn thương, mục tiêu — coach trả lời theo dữ liệu thật của bạn.
            </p>
          </div>
          {messages.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={pending}
              aria-label="Xoá lịch sử"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá lịch sử
            </Button>
          ) : null}
        </header>

        {!llmConfigured ? (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Đang chạy chế độ <strong>rule-based</strong> (chưa cấu hình OPENAI_API_KEY).
              Trả lời vẫn dựa trên dữ liệu cá nhân của bạn nhưng theo công thức cố định.
              Để bật LLM: set <code className="rounded bg-amber-100/50 px-1 dark:bg-amber-900/50">OPENAI_API_KEY</code> trong env.
            </p>
          </div>
        ) : null}

        <div
          ref={scrollerRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border-subtle bg-surface/50 p-4"
          aria-label="Lịch sử chat"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center text-sm text-text-secondary">
              <Bot className="h-10 w-10 text-text-tertiary" aria-hidden />
              <div>
                <p className="font-medium text-text-primary">Bắt đầu trò chuyện</p>
                <p className="mt-1">Chọn 1 prompt gợi ý bên dưới hoặc nhập câu hỏi của bạn.</p>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} message={m} llmConfigured={llmConfigured} />
            ))
          )}
          {pending ? (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Coach đang nghĩ...
            </div>
          ) : null}
        </div>

        {messages.length === 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submit(prompt)}
                disabled={pending}
                className="rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-text-primary disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 flex items-center gap-2 text-sm text-state-error"
          >
            <AlertCircle className="h-4 w-4" aria-hidden />
            {error}
          </p>
        ) : null}

        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi coach... (vd: tôi nên ăn bao nhiêu protein?)"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            maxLength={2000}
            disabled={pending}
          />
          <Button type="submit" disabled={pending || input.trim().length === 0}>
            <Send className="h-4 w-4" aria-hidden />
            Gửi
          </Button>
        </form>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserIcon className="h-4 w-4 text-brand" aria-hidden />
              Hồ sơ của bạn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Giới tính" value={profile.gender === "female" ? "Nữ" : profile.gender === "male" ? "Nam" : "—"} />
            <Row label="Mục tiêu" value={goalLabel(profile.goal)} />
            <Row label="Trình độ" value={levelLabel(profile.level)} />
            <Row label="Dụng cụ" value={equipmentLabel(profile.equipment)} />
            {profile.heightCm ? <Row label="Chiều cao" value={`${profile.heightCm}cm`} /> : null}
            {profile.currentWeightKg ? (
              <Row
                label="Cân hiện tại"
                value={`${profile.currentWeightKg}kg${profile.bmi !== null ? ` (BMI ${profile.bmi})` : ""}`}
              />
            ) : null}
            {profile.targetWeightKg ? (
              <Row label="Cân mục tiêu" value={`${profile.targetWeightKg}kg`} />
            ) : null}
            <Link
              href="/onboarding?redo=1"
              className="mt-2 inline-block text-xs text-brand hover:underline"
            >
              Cập nhật hồ sơ →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              {(() => {
                const delta = progress.weightDeltaKg30d ?? 0;
                // For weight_loss / toning goals, a decrease is good. For
                // muscle_gain / strength goals, an increase is good. When goal
                // is unset, default to "loss = good" (most common beginner
                // use-case).
                const lossIsGoal =
                  !profile.goal ||
                  profile.goal === "weight_loss" ||
                  profile.goal === "toning";
                const movingTowardGoal = lossIsGoal ? delta <= 0 : delta >= 0;
                const Icon = lossIsGoal
                  ? delta <= 0
                    ? TrendingDown
                    : TrendingUp
                  : delta >= 0
                    ? TrendingUp
                    : TrendingDown;
                return (
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      movingTowardGoal
                        ? "text-state-success"
                        : "text-state-warning",
                    )}
                    aria-hidden
                  />
                );
              })()}
              Tình hình 30 ngày
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Completion 7 ngày" value={`${progress.last7DaysCompletion}%`} />
            <Row label="Completion 30 ngày" value={`${progress.last30DaysCompletion}%`} />
            <Row
              label="Buổi training 7 ngày"
              value={`${progress.last7DaysTrainingDays}`}
            />
            {progress.streakDays > 0 ? (
              <Row
                label="Streak"
                value={
                  <span className="inline-flex items-center gap-1 text-state-success">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    {progress.streakDays} buổi
                  </span>
                }
              />
            ) : null}
            {progress.consecutiveMissedDays > 0 ? (
              <Row
                label="Miss liên tiếp"
                value={
                  <span className="text-state-warning">
                    {progress.consecutiveMissedDays} buổi
                  </span>
                }
              />
            ) : null}
            {progress.weightDeltaKg30d !== null ? (
              <Row
                label="Δ Cân 30 ngày"
                value={`${progress.weightDeltaKg30d > 0 ? "+" : ""}${progress.weightDeltaKg30d}kg`}
              />
            ) : null}
          </CardContent>
        </Card>

        {plan.slug && plan.title ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Giáo án hiện tại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-text-primary">{plan.title}</p>
              {plan.daysPerWeek ? (
                <p className="text-text-secondary">{plan.daysPerWeek} buổi/tuần</p>
              ) : null}
              <Link
                href={`/giao-an/${plan.slug}`}
                className="inline-block text-xs text-brand hover:underline"
              >
                Mở chi tiết →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chưa có giáo án</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-text-secondary">
              <Link href="/giao-an" className="text-brand hover:underline">
                Chọn giáo án →
              </Link>
            </CardContent>
          </Card>
        )}

        <details className="rounded-lg border border-border-subtle bg-surface/50 p-3 text-xs text-text-secondary">
          <summary className="cursor-pointer font-medium text-text-primary">
            Context coach đang dùng
          </summary>
          <p className="mt-2 leading-relaxed">{contextSummary}</p>
        </details>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

function MessageBubble({
  message,
  llmConfigured,
}: {
  message: CoachChatMessage;
  llmConfigured: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-brand/15 text-brand"
            : "bg-surface-raised text-text-secondary border border-border-subtle",
        )}
        aria-hidden
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-brand text-brand-foreground"
            : "bg-surface text-text-primary border border-border-subtle",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          renderAssistantContent(message.content)
        )}
        {!isUser && message.source === "fallback" && llmConfigured ? (
          <p className="mt-2 text-[10px] uppercase tracking-wider text-text-tertiary">
            Rule-based (LLM fell back)
          </p>
        ) : null}
      </div>
    </div>
  );
}

function goalLabel(goal: CoachContext["profile"]["goal"]): string {
  switch (goal) {
    case "weight_loss":
      return "Giảm cân";
    case "muscle_gain":
      return "Tăng cơ";
    case "toning":
      return "Săn chắc";
    case "strength":
      return "Sức mạnh";
    default:
      return "—";
  }
}

function levelLabel(level: CoachContext["profile"]["level"]): string {
  switch (level) {
    case "beginner":
      return "Mới bắt đầu";
    case "intermediate":
      return "Trung cấp";
    case "advanced":
      return "Nâng cao";
    default:
      return "—";
  }
}

function equipmentLabel(equipment: CoachContext["profile"]["equipment"]): string {
  if (!equipment || equipment.length === 0) return "—";
  return equipment
    .map((e) =>
      e === "full_gym"
        ? "Gym đầy đủ"
        : e === "home_dumbbell"
          ? "Tạ tại nhà"
          : e === "bodyweight"
            ? "Tay không"
            : e,
    )
    .join(", ");
}
