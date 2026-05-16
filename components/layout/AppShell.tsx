import * as React from "react";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </div>
  );
}
