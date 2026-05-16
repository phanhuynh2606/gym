"use client";

import { BookOpen, Dumbbell, Home, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/giao-an", label: "Giáo án", icon: Dumbbell },
  { href: "/bai-tap", label: "Bài tập", icon: BookOpen },
  { href: "/nhom-co", label: "Nhóm cơ", icon: UserRound },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border-subtle bg-surface shadow-overlay"
      aria-label="Điều hướng mobile"
    >
      <ul className="flex items-stretch justify-around">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px]",
                  active ? "text-brand" : "text-text-secondary",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
