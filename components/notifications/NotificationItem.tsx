"use client";

import dayjs from "dayjs";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Award,
  Bell,
  CalendarCheck2,
  ListTodo,
  ScrollText,
  Sparkles,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { markNotificationRead } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import type { NotificationView } from "@/lib/notifications";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const ICON_MAP: Record<NotificationView["type"], typeof Bell> = {
  reminder_workout: CalendarCheck2,
  reminder_todo: ListTodo,
  reminder_metrics: ScrollText,
  streak_milestone: Trophy,
  monthly_review_ready: Sparkles,
  achievement_unlocked: Award,
  system: Bell,
};

type Props = {
  notification: NotificationView;
};

export function NotificationItem({ notification }: Props) {
  const [pending, startTransition] = useTransition();
  const Icon = ICON_MAP[notification.type] ?? Bell;
  const when = dayjs(notification.createdAt).fromNow();

  function markRead() {
    if (notification.read || pending) return;
    startTransition(async () => {
      await markNotificationRead(notification.id);
    });
  }

  const body = (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-4 transition-colors",
        notification.read
          ? "border-border-subtle bg-surface"
          : "border-brand/30 bg-brand/5",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          notification.read
            ? "bg-border-subtle text-text-secondary"
            : "bg-brand/15 text-brand",
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm",
              notification.read ? "font-medium" : "font-semibold",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-text-muted">{when}</span>
        </div>
        <p className="mt-1 text-sm text-text-secondary">{notification.body}</p>
        <div className="mt-3 flex items-center gap-2">
          {!notification.read ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markRead();
              }}
              disabled={pending}
              className="h-7 px-2 text-xs"
            >
              {pending ? "Đang đánh dấu..." : "Đánh dấu đã đọc"}
            </Button>
          ) : (
            <span className="text-xs text-text-muted">Đã đọc</span>
          )}
        </div>
      </div>
    </div>
  );

  if (!notification.href) return body;

  return (
    <Link
      href={notification.href}
      onClick={markRead}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-md"
    >
      {body}
    </Link>
  );
}
