import * as React from "react";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({
  children,
  withSidebar = false,
}: {
  children: React.ReactNode;
  withSidebar?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1">
        {withSidebar && <Sidebar />}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
      <Footer />
      <MobileNav />
    </div>
  );
}
