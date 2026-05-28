"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  unreadCount: number;
};

/**
 * TopBar bell: links to `/thong-bao`. Shows a numeric badge when there are
 * unread notifications, capped at "9+" to keep the icon compact.
 */
export function NotificationBell({ unreadCount }: Props) {
  const pathname = usePathname();
  const active = pathname.startsWith("/thong-bao");
  const display = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Link
      href="/thong-bao"
      aria-label={
        unreadCount > 0
          ? `Thông báo (${unreadCount} chưa đọc)`
          : "Thông báo"
      }
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-brand/10 text-brand"
          : "text-text-secondary hover:bg-border-subtle/60 hover:text-text-primary",
      )}
    >
      <Bell className="h-5 w-5" aria-hidden />
      {unreadCount > 0 ? (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-state-error px-1 text-[10px] font-semibold leading-none text-white shadow-raised"
        >
          {display}
        </span>
      ) : null}
    </Link>
  );
}
