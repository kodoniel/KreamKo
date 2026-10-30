"use client";

import React from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import type { SessionPayload } from "@/types";

interface DashboardShellProps {
  user: SessionPayload;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* Desktop Sidebar (hidden on mobile) */}
      <Sidebar user={user} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Top Header */}
        <Header user={user} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation (hidden on desktop) */}
        <MobileNav user={user} />
      </div>
    </div>
  );
}

