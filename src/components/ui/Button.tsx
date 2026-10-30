import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "warning" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold transition-all rounded-2xl active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer disabled:cursor-not-allowed select-none touch-manipulation";

    const variants = {
      primary:
        "bg-[#FFB5C2] hover:bg-[#ffa3b3] active:bg-[#f28e9f] text-gray-900 shadow-sm border border-[#f5a2b1]/40",
      secondary:
        "bg-[#A8E6CF] hover:bg-[#94dfc1] active:bg-[#7bcba8] text-gray-900 shadow-sm border border-[#8fd7bb]/40",
      warning:
        "bg-[#FFE0A3] hover:bg-[#fbd58c] active:bg-[#f5c55a] text-gray-900 shadow-sm border border-[#f0cb7f]/40",
      outline:
        "bg-white hover:bg-[#FFF8F0] active:bg-gray-100 text-gray-800 border border-[#E5E1DC] shadow-xs",
      ghost:
        "bg-transparent hover:bg-black/5 active:bg-black/10 text-gray-700",
      danger:
        "bg-[#FFD6DE] hover:bg-[#ffbac8] active:bg-[#ffa3b3] text-[#b82e46] border border-[#f5a2b1]/50 shadow-xs",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs gap-1.5 min-h-[36px]",
      md: "px-4 py-2.5 text-sm gap-2 min-h-[44px]", // 44px min tap target
      lg: "px-6 py-3.5 text-base gap-2.5 min-h-[52px]", // large counter thumb target
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

