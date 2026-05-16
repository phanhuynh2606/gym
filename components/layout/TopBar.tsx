"use client";

import {
  Apple,
  BookOpen,
  Dumbbell,
  Home,
  Menu,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BROWSE_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, typeof Home> = {
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  "user-round": UserRound,
  apple: Apple,
};

export function TopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border-subtle bg-surface">
      <div className="container-app flex h-full items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Mở menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar text-sidebar-foreground">
              <SheetTitle className="text-sidebar-foreground">GymVN</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    pathname === "/"
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Home className="h-4 w-4" />
                  Trang chủ
                </Link>
                {BROWSE_NAV.map((item) => {
                  const Icon = ICON_MAP[item.icon] ?? Dumbbell;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                        active
                          ? "bg-sidebar-active text-white"
                          : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex items-center gap-2 text-text-primary hover:text-brand"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white">
              <Dumbbell className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">GymVN</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/giao-an"
            className="hidden md:inline-flex text-sm text-text-secondary hover:text-text-primary"
          >
            Giáo án
          </Link>
          <Link
            href="/bai-tap"
            className="hidden md:inline-flex text-sm text-text-secondary hover:text-text-primary"
          >
            Bài tập
          </Link>
          <Button asChild variant="primary" size="sm">
            <Link href="/hom-nay">Bắt đầu</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
