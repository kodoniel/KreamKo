import { prisma } from "@/lib/db";
import Link from "next/link";
import { AlertCircle, IceCream, Clock, CheckCircle } from "lucide-react";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";

interface RegisterPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = typeof resolvedSearchParams.token === "string" ? resolvedSearchParams.token : null;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F0]">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E5E1DC] p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFD6DE] text-[#E8899A] mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invalid Invite Link</h2>
          <p className="text-sm text-gray-500 mb-6">
            This invitation link is missing or malformed. Please request a new invite link from your Admin.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-4 bg-[#FFF8F0] border border-[#E5E1DC] hover:bg-gray-50 text-gray-700 font-bold rounded-2xl text-sm transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Look up invite token in database
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { createdBy: { select: { name: true } } },
  });

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F0]">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E5E1DC] p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFD6DE] text-[#E8899A] mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invite Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">
            We couldn&apos;t find this invitation. It may have been revoked or deleted.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-4 bg-[#FFF8F0] border border-[#E5E1DC] hover:bg-gray-50 text-gray-700 font-bold rounded-2xl text-sm transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (invite.usedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F0]">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E5E1DC] p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFECC4] text-[#F5C55A] mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invite Already Used</h2>
          <p className="text-sm text-gray-500 mb-6">
            This invitation link has already been used to create an account. If this is your account, please log in.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-4 bg-[#FFB5C2] hover:bg-[#ffa3b3] text-gray-900 font-bold rounded-2xl text-sm transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F0]">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-sm border border-[#E5E1DC] p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFD6DE] text-[#E8899A] mx-auto mb-4 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invite Expired</h2>
          <p className="text-sm text-gray-500 mb-6">
            Invite links expire after 48 hours for security. Please ask your Admin to generate a fresh invite link for you.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-4 bg-[#FFF8F0] border border-[#E5E1DC] hover:bg-gray-50 text-gray-700 font-bold rounded-2xl text-sm transition-all"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F0]">
      <div className="w-full max-w-sm">
        {/* Stall Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#C8F0DE] text-[#7BCBA8] mb-3 shadow-sm">
            <IceCream className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">
            Kream Ko
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Invited by <span className="font-semibold text-gray-700">{invite.createdBy.name}</span>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E1DC] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Set up your account</h2>
          <p className="text-xs text-gray-500 mb-6">
            Enter your name and choose a secure password to begin.
          </p>

          <RegisterForm token={token} role={invite.role} />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-gray-700 underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
