"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  BarChart3,
  Users,
  LogOut,
  IceCream,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/types";

interface SidebarProps {
  user: SessionPayload;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      sublabel: "Overview & summary",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      label: "Daily Sales",
      sublabel: "Counter point-of-sale",
      href: "/sales",
      icon: ShoppingBag,
      active: pathname.startsWith("/sales"),
    },
    {
      label: "Stock Inventory",
      sublabel: "Packs, counts & wastage",
      href: "/inventory",
      icon: Boxes,
      active: pathname.startsWith("/inventory"),
    },
    {
      label: "Reports",
      sublabel: "Sales, trends & usage",
      href: "/reports",
      icon: BarChart3,
      active: pathname.startsWith("/reports"),
    },
    ...(user.role === "ADMIN"
      ? [
          {
            label: "Team & Users",
            sublabel: "Invite & permissions",
            href: "/users",
            icon: Users,
            active: pathname.startsWith("/users"),
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#FFF8F0] border-r border-[#E5E1DC] z-30">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-[#FFD6DE] text-[#E8899A] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <IceCream className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-gray-900 tracking-tight leading-tight">
              Kream Ko
            </h1>
            <p className="text-xs text-gray-500 font-medium">Stall Management</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer group",
                item.active
                  ? "bg-white text-gray-900 font-bold shadow-xs border border-[#E5E1DC]"
                  : "text-gray-600 hover:bg-white/60 hover:text-gray-900"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0",
                  item.active
                    ? "bg-[#FFD6DE] text-[#E8899A]"
                    : "bg-black/5 text-gray-500 group-hover:bg-[#FFD6DE]/60 group-hover:text-[#E8899A]"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 truncate">
                <span className="block text-sm leading-tight">{item.label}</span>
                <span className="block text-[11px] text-gray-400 font-normal leading-tight mt-0.5 truncate">
                  {item.sublabel}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-[#E5E1DC] bg-[#FFFDF9]">
        <div className="p-3 rounded-2xl bg-white border border-[#E5E1DC] shadow-xs flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 truncate">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                user.role === "ADMIN"
                  ? "bg-[#FFECC4] text-amber-900"
                  : "bg-[#C8F0DE] text-emerald-900"
              }`}
            >
              {user.role === "ADMIN" ? (
                <Shield className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-gray-900 truncate leading-tight">
                {user.name}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold leading-tight mt-0.5">
                {user.role}
              </p>
            </div>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full py-2.5 px-3 rounded-2xl hover:bg-[#FFD6DE]/40 active:bg-[#FFD6DE] text-gray-600 hover:text-[#b82e46] transition-all flex items-center justify-center gap-2 text-xs font-bold border border-transparent hover:border-[#FFB5C2] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

