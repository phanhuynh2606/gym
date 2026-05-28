"use client";

import {
  Dumbbell,
  Gauge,
  ImageIcon,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
  exact?: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: Gauge, exact: true },
  { href: "/admin/exercises", label: "Bài tập", icon: Dumbbell },
  { href: "/admin/workout-plans", label: "Giáo án", icon: ListChecks },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="flex flex-wrap items-center gap-1 rounded-md border border-border-subtle bg-surface p-1"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-border-subtle/60",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
