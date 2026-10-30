"use client";

import { useState, useTransition } from "react";
import {
  createInviteLink,
  toggleUserActive,
  changeUserRole,
} from "@/lib/actions/auth";
import type { SafeUser } from "@/types";
import {
  UserPlus,
  Copy,
  Check,
  Shield,
  User,
  Power,
  Clock,
  Sparkles,
  AlertCircle,
  Share2,
} from "lucide-react";

interface UsersClientProps {
  initialUsers: SafeUser[];
  currentUserId: string;
}

export default function UsersClient({
  initialUsers,
  currentUserId,
}: UsersClientProps) {
  const [users, setUsers] = useState<SafeUser[]>(initialUsers);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [copied, setCopied] = useState(false);
  const [isGenerating, startGenerating] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvite = () => {
    setError(null);
    startGenerating(async () => {
      const res = await createInviteLink(inviteRole);
      if (res.success) {
        setInviteUrl(res.data);
        setCopied(false);
      } else {
        setError(res.error);
      }
    });
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Failed to copy to clipboard. Please copy manually.");
    }
  };

  const handleToggleActive = async (userId: string) => {
    setError(null);
    setUpdatingId(userId);
    const res = await toggleUserActive(userId);
    setUpdatingId(null);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
      );
    } else {
      setError(res.error);
    }
  };

  const handleChangeRole = async (userId: string, newRole: "ADMIN" | "STAFF") => {
    setError(null);
    setUpdatingId(userId);
    const res = await changeUserRole(userId, newRole);
    setUpdatingId(null);

    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            Team & Staff
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage who has access to the stall counter and inventory.
          </p>
        </div>

        {/* Generate Invite Trigger */}
        <div className="flex items-center gap-2">
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "STAFF" | "ADMIN")}
            className="py-2.5 px-3 bg-white border border-[#E5E1DC] rounded-2xl text-xs font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFB5C2]"
          >
            <option value="STAFF">Role: Staff</option>
            <option value="ADMIN">Role: Admin</option>
          </select>
          <button
            onClick={handleGenerateInvite}
            disabled={isGenerating}
            className="py-2.5 px-4 bg-[#FFB5C2] hover:bg-[#ffa3b3] active:bg-[#f28e9f] text-gray-900 font-bold rounded-2xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isGenerating ? "Generating..." : "New Invite Link"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-[#FFD6DE]/60 border border-[#FFB5C2] text-[#c73e57] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generated Invite Link Banner */}
      {inviteUrl && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#FFF8F0] to-[#FFECC4]/60 border-2 border-[#FFE0A3] shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FFE0A3] flex items-center justify-center text-amber-800 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Invite Link Ready ({inviteRole} access)
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-amber-700" />
                  Expires in 48 hours. One-time use only.
                </p>
              </div>
            </div>
            <button
              onClick={() => setInviteUrl(null)}
              className="text-xs text-gray-400 hover:text-gray-600 p-1"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-[#E5E1DC]">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="w-full text-xs text-gray-700 bg-transparent px-2 focus:outline-none truncate font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-[#FFB5C2] hover:bg-[#ffa3b3] active:bg-[#f28e9f] text-gray-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-800" />
                  <span className="text-emerald-900">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            Send this URL to your staff via Messenger or chat. They will click it and choose their own password.
          </p>
        </div>
      )}

      {/* Users List Card */}
      <div className="bg-white rounded-3xl border border-[#E5E1DC] shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5E1DC] bg-[#FFFDF9] flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">
            Active Accounts ({users.length})
          </h2>
          <span className="text-xs text-gray-400">
            {users.filter((u) => u.isActive).length} active
          </span>
        </div>

        <div className="divide-y divide-[#E5E1DC]">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            const isBusy = updatingId === u.id;

            return (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/50 transition-colors"
              >
                {/* User info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      u.role === "ADMIN"
                        ? "bg-[#FFECC4] text-amber-800"
                        : "bg-[#C8F0DE] text-emerald-800"
                    }`}
                  >
                    {u.role === "ADMIN" ? (
                      <Shield className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">{u.name}</h3>
                      {isSelf && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          You
                        </span>
                      )}
                      {!u.isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD6DE] text-[#c73e57]">
                          Deactivated
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{u.email}</p>
                  </div>
                </div>

                {/* Actions & Controls */}
                <div className="flex items-center gap-2 sm:self-center pl-14 sm:pl-0">
                  {/* Role Selector */}
                  <select
                    disabled={isSelf || isBusy}
                    value={u.role}
                    onChange={(e) =>
                      handleChangeRole(u.id, e.target.value as "ADMIN" | "STAFF")
                    }
                    className="py-1.5 px-3 bg-[#FFFDF9] border border-[#E5E1DC] rounded-xl text-xs font-semibold text-gray-700 disabled:opacity-50 disabled:bg-gray-50 focus:outline-none"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>

                  {/* Toggle Active Button */}
                  <button
                    disabled={isSelf || isBusy}
                    onClick={() => handleToggleActive(u.id)}
                    title={u.isActive ? "Deactivate user" : "Reactivate user"}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      u.isActive
                        ? "border-[#E5E1DC] text-gray-600 hover:bg-[#FFD6DE]/40 hover:text-red-700"
                        : "border-[#A8E6CF] bg-[#C8F0DE]/60 text-emerald-800 hover:bg-[#A8E6CF]"
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span className="text-[11px]">
                      {u.isActive ? "Deactivate" : "Activate"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

