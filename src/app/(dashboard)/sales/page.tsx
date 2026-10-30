import { requireSession } from "@/lib/auth";
import { getMenuProducts, getSalesForDay, getDailyCashCount } from "@/lib/actions/sales";
import { SalesClient } from "@/components/sales/SalesClient";

export default async function SalesPage() {
  const session = await requireSession();
  const isAdmin = session.role === "ADMIN";

  // Fetch initial data concurrently
  const [menuRes, salesRes, cashCountRes] = await Promise.all([
    getMenuProducts(),
    getSalesForDay(),
    getDailyCashCount(),
  ]);

  const products = menuRes.success ? menuRes.data : [];
  const sales = salesRes.success ? salesRes.data.sales : [];
  const totals = salesRes.success
    ? salesRes.data.totals
    : { total: 0, cash: 0, gcash: 0, count: 0 };
  const cashCount = cashCountRes.success ? cashCountRes.data : null;

  return (
    <SalesClient
      initialProducts={products}
      initialSales={sales}
      initialTotals={totals}
      initialCashCount={cashCount}
      isAdmin={isAdmin}
      currentUser={{
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    />
  );
}
