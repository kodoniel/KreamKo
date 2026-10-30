import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import UsersClient from "./UsersClient";
import type { SafeUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireAdmin();

  const users: SafeUser[] = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-4 sm:p-8">
      <UsersClient initialUsers={users} currentUserId={session.userId} />
    </div>
  );
}
