"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Boxes, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionPayload } from "@/types";

interface MobileNavProps {
  user: SessionPayload;
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      label: "Sales",
      href: "/sales",
      icon: ShoppingBag,
      active: pathname.startsWith("/sales"),
    },
    {
      label: "Stock",
      href: "/inventory",
      icon: Boxes,
      active: pathname.startsWith("/inventory"),
    },
    {
      label: "Reports",
      href: "/reports",
      icon: BarChart3,
      active: pathname.startsWith("/reports"),
    },
    ...(user.role === "ADMIN"
      ? [
          {
            label: "Team",
            href: "/users",
            icon: Users,
            active: pathname.startsWith("/users"),
          },
        ]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#FFF8F0]/95 backdrop-blur-lg border-t border-[#E5E1DC] pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-2xl min-h-[50px] transition-all cursor-pointer",
                item.active
                  ? "bg-white text-gray-900 font-bold shadow-xs border border-[#E5E1DC]"
                  : "text-gray-500 hover:text-gray-800 active:scale-95"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    item.active && "text-[#E8899A] scale-110"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 tracking-tight",
                  item.active ? "font-bold text-gray-900" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

