import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/actions/dashboard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardHomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const res = await getDashboardData();
  const stats = res.success
    ? res.data
    : {
        todaySales: 0,
        cashSales: 0,
        gcashSales: 0,
        itemsSold: 0,
        transactionCount: 0,
        bestProduct: null,
        bestFlavor: null,
        lowStockItems: [],
        todayWastageCount: 0,
        todayWastageCost: 0,
        eodStockCountDone: false,
        eodCashCountDone: false,
        eodCashCountDetails: null,
        last7DaysSales: [],
      };

  return <DashboardClient stats={stats} user={session} />;
}
