"use client";

import { useActionState, useState } from "react";
import { registerWithInvite } from "@/lib/actions/auth";
import { UserCheck, Lock, Mail, User, Eye, EyeOff, Loader2 } from "lucide-react";

interface RegisterFormProps {
  token: string;
  role: string;
}

export default function RegisterForm({ token, role }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(registerWithInvite, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      {!state?.success && state?.error && (
        <div className="p-3 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8899A] shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5"
        >
          Your Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Maria Santos"
            className="w-full pl-10 pr-4 py-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
          />
        </div>
      </div>

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
            required
            placeholder="maria@kreamko.ph"
            className="w-full pl-10 pr-4 py-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5"
        >
          Create Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full pl-10 pr-11 py-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
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

      <div className="p-3 rounded-2xl bg-[#C8F0DE]/40 border border-[#A8E6CF] flex items-center gap-2 text-xs text-gray-700">
        <UserCheck className="w-4 h-4 text-[#7BCBA8] shrink-0" />
        <span>
          Joining as <strong className="font-bold uppercase">{role}</strong>
        </span>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-3.5 px-4 bg-[#A8E6CF] hover:bg-[#92dabf] active:bg-[#7bcba8] text-gray-900 font-bold rounded-2xl shadow-sm text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Activate Account</span>
        )}
      </button>
    </form>
  );
}
