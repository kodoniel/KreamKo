import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "mint" | "yellow" | "pink" | "gray" | "blue";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "gray",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    mint: "bg-[#C8F0DE] text-emerald-900 border-[#A8E6CF]",
    yellow: "bg-[#FFECC4] text-amber-900 border-[#FFE0A3]",
    pink: "bg-[#FFD6DE] text-[#b82e46] border-[#FFB5C2]",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-sky-100 text-sky-800 border-sky-200",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold rounded-full border tracking-wide uppercase",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

