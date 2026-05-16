"use client";

import {
  Apple,
  BarChart,
  BookOpen,
  Calendar,
  CalendarDays,
  Dumbbell,
  Heart,
  Home,
  ListTodo,
  TrendingUp,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV, BROWSE_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, typeof Home> = {
  "calendar-days": CalendarDays,
  "list-todo": ListTodo,
  calendar: Calendar,
  "trending-up": TrendingUp,
  "bar-chart": BarChart,
  heart: Heart,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  "user-round": UserRound,
  apple: Apple,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex sticky top-14 h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-4">
          <p className="px-2 mb-2 text-xs uppercase tracking-wider text-sidebar-muted">
            Cá nhân
          </p>
          <nav className="flex flex-col gap-0.5">
            {APP_NAV.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Home;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-3">
          <p className="px-2 mb-2 text-xs uppercase tracking-wider text-sidebar-muted">
            Khám phá
          </p>
          <nav className="flex flex-col gap-0.5">
            {BROWSE_NAV.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? Dumbbell;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-3 border-t border-white/5">
        <Link
          href="/"
          className="block text-xs text-sidebar-muted hover:text-white"
        >
          ← Về trang chủ
        </Link>
      </div>
    </aside>
  );
}
