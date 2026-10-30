import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InventoryClient } from "@/components/inventory/InventoryClient";

export default async function InventoryPage() {
  const session = await requireSession();
  const isAdmin = session.role === "ADMIN";

  // Fetch active stock items
  const items = await prisma.stockItem.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  // Fetch recent stock audit logs
  const logs = await prisma.stockLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      stockItem: { select: { name: true, unitLabel: true } },
      user: { select: { name: true } },
    },
  });

  return (
    <InventoryClient
      initialItems={items}
      isAdmin={isAdmin}
      initialLogs={logs}
    />
  );
}
