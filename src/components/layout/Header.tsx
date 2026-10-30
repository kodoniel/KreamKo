"use client";

import Link from "next/link";
import { logout } from "@/lib/actions/auth";
import { SyncBadge } from "@/components/ui/SyncBadge";
import { IceCream, LogOut, Shield, User } from "lucide-react";
import type { SessionPayload } from "@/types";

interface HeaderProps {
  user: SessionPayload;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#FFF8F0]/90 backdrop-blur-md border-b border-[#E5E1DC] px-4 py-2.5 sm:px-6">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Brand (Mobile view or compact) */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-2xl bg-[#FFD6DE] text-[#E8899A] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <IceCream className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-gray-900 tracking-tight leading-none block">
                Kream Ko
              </span>
              <span className="text-[10px] text-gray-500 font-medium leading-none block mt-0.5">
                Stall Counter
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Sync Status + User Badge + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SyncBadge />

          {/* User Info Capsule */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white border border-[#E5E1DC] shadow-xs">
            <div
              className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                user.role === "ADMIN"
                  ? "bg-[#FFECC4] text-amber-900"
                  : "bg-[#C8F0DE] text-emerald-900"
              }`}
            >
              {user.role === "ADMIN" ? (
                <Shield className="w-3.5 h-3.5" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-gray-800 leading-none block">
                {user.name.split(" ")[0]}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold leading-none block mt-0.5">
                {user.role}
              </span>
            </div>
          </div>

          {/* Quick Logout Button */}
          <form action={logout}>
            <button
              type="submit"
              title="Sign Out"
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-white hover:bg-[#FFD6DE]/40 active:bg-[#FFD6DE] text-gray-600 hover:text-[#b82e46] border border-[#E5E1DC] transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

