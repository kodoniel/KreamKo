import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getReportsData } from "@/lib/actions/reports";
import { ReportsClient } from "@/components/reports/ReportsClient";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const res = await getReportsData({ rangeType: "7days" });
  if (!res.success) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-[#E5E1DC]">
        <h2 className="text-lg font-bold text-gray-900">Failed to load reports</h2>
        <p className="text-xs text-gray-500 mt-1">{res.error}</p>
      </div>
    );
  }

  return (
    <ReportsClient
      initialData={res.data}
      isAdmin={session.role === "ADMIN"}
    />
  );
}
