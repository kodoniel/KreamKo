"use client";

import { useActionState, useState } from "react";
import { login } from "@/lib/actions/auth";
import { IceCream, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F0]">
      <div className="w-full max-w-sm">
        {/* Stall Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFD6DE] text-[#E8899A] mb-3 shadow-sm">
            <IceCream className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Kream Ko
          </h1>
          <p className="text-sm text-gray-500 mt-1">Staff & Inventory Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E1DC] p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome back</h2>
          <p className="text-xs text-gray-500 mb-6">
            Enter your credentials to access the stall counter.
          </p>

          {!state?.success && state?.error && (
            <div className="mb-5 p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8899A] shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@kreamko.ph"
                  className="w-full pl-10 pr-4 py-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFB5C2] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3.5 px-4 bg-[#FFB5C2] hover:bg-[#ffa3b3] active:bg-[#f28e9f] text-gray-900 font-bold rounded-2xl shadow-sm text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Private system. Need access? Ask your Admin for an invite link.
        </p>
      </div>
    </div>
  );
}
