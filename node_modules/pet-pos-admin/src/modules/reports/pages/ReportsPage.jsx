import { useEffect, useMemo, useState } from "react";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartInput() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function StatCard({ title, value, helper, tone = "default" }) {
  const tones = {
    default: "border-slate-200 bg-white text-slate-950",
    dark: "border-slate-950 bg-slate-950 text-white",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    red: "border-red-200 bg-red-50 text-red-950",
    orange: "border-orange-200 bg-orange-50 text-orange-950",
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    purple: "border-purple-200 bg-purple-50 text-purple-950",
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${tones[tone]}`}>
      <p
        className={`text-sm font-bold ${
          tone === "dark" ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {title}
      </p>
      <h3 className="mt-2 text-3xl font-black">{value}</h3>
      {helper ? (
        <p
          className={`mt-1 text-xs font-semibold ${
            tone === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function SectionCard({ title, description, children, action }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>

      {children}
    </div>
  );
}

function MiniBar({ label, value, max, suffix = "" }) {
  const percentage = max > 0 ? Math.min((Number(value || 0) / max) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="truncate font-bold text-slate-700">{label}</span>
        <span className="shrink-0 font-black text-slate-950">
          {value}
          {suffix}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-950"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(monthStartInput());
  const [dateTo, setDateTo] = useState(todayInput());
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  const params = useMemo(() => {
    const search = new URLSearchParams();
    if (dateFrom) search.set("date_from", dateFrom);
    if (dateTo) search.set("date_to", dateTo);
    return search.toString();
  }, [dateFrom, dateTo]);

  async function loadReport() {
    try {
      setLoading(true);
      setMessage("");

      const res = await apiFetch(`/admin/reports/summary?${params}`);
      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to load reports.");
        return;
      }

      setReport(json.data);
    } catch (error) {
      console.error("[ReportsPage]", error);
      setMessage("Something went wrong while loading reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [params]);

  const sales = report?.sales_summary || {};
  const inventory = report?.inventory_summary || {};
  const cod = report?.cod_summary || {};

  const dailyMax = Math.max(
    ...(report?.daily_sales || []).map((row) => Number(row.total_sales || 0)),
    0
  );

  const productMax = Math.max(
    ...(report?.top_products || []).map((row) => Number(row.units_sold || 0)),
    0
  );

  const channelMax = Math.max(
    ...(report?.channel_breakdown || []).map((row) => Number(row.total_sales || 0)),
    0
  );

  const paymentMax = Math.max(
    ...(report?.payment_breakdown || []).map((row) => Number(row.total_amount || 0)),
    0
  );

  function setPreset(type) {
    const now = new Date();

    if (type === "today") {
      const today = todayInput();
      setDateFrom(today);
      setDateTo(today);
      return;
    }

    if (type === "month") {
      setDateFrom(monthStartInput());
      setDateTo(todayInput());
      return;
    }

    if (type === "last7") {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      setDateFrom(d.toISOString().slice(0, 10));
      setDateTo(todayInput());
      return;
    }

    if (type === "last30") {
      const d = new Date();
      d.setDate(now.getDate() - 29);
      setDateFrom(d.toISOString().slice(0, 10));
      setDateTo(todayInput());
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Business Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Reports Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Sales, orders, inventory value, low stock, COD, riders, customers,
            and promotion performance in one dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReport}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <button
            type="button"
            onClick={() => setPreset("today")}
            className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setPreset("last7")}
            className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            7 Days
          </button>

          <button
            type="button"
            onClick={() => setPreset("last30")}
            className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            30 Days
          </button>

          <button
            type="button"
            onClick={() => setPreset("month")}
            className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            This Month
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
          Loading reports...
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
            <StatCard
              title="Gross Sales"
              value={money(sales.gross_sales)}
              helper="Selected period"
              tone="dark"
            />
            <StatCard
              title="Orders"
              value={sales.total_orders || 0}
              helper={`${sales.completed_orders || 0} completed`}
              tone="blue"
            />
            <StatCard
              title="Average Order"
              value={money(sales.average_order_value)}
              helper="AOV"
              tone="green"
            />
            <StatCard
              title="Discounts"
              value={money(sales.total_discount)}
              helper="Manual + promo"
              tone="orange"
            />
            <StatCard
              title="Unpaid Orders"
              value={sales.unpaid_orders || 0}
              helper="Needs payment"
              tone="red"
            />
            <StatCard
              title="Delivery Fees"
              value={money(sales.delivery_fees)}
              helper="Collected"
              tone="purple"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
            <StatCard
              title="Inventory Cost"
              value={money(inventory.inventory_cost_value)}
              helper="Stock × cost"
            />
            <StatCard
              title="Inventory Sale Value"
              value={money(inventory.inventory_sale_value)}
              helper="Stock × sale price"
            />
            <StatCard
              title="Stock Units"
              value={inventory.total_stock_units || 0}
              helper={`${inventory.total_products || 0} products`}
            />
            <StatCard
              title="Low Stock"
              value={inventory.low_stock_count || 0}
              helper="Needs restock"
              tone="orange"
            />
            <StatCard
              title="Expiring Soon"
              value={inventory.expiring_soon_count || 0}
              helper="Next 30 days"
              tone="red"
            />
            <StatCard
              title="Pending COD"
              value={money(cod.pending_cod_amount)}
              helper={`${cod.pending_cod_orders || 0} orders`}
              tone="red"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Daily Sales"
              description="Revenue trend by day."
            >
              <div className="space-y-4 p-6">
                {(report?.daily_sales || []).length ? (
                  report.daily_sales.map((row) => (
                    <MiniBar
                      key={row.sale_date}
                      label={row.sale_date}
                      value={money(row.total_sales)}
                      max={dailyMax}
                    />
                  ))
                ) : (
                  <EmptyState text="No daily sales found for selected date range." />
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Top Products"
              description="Best selling products by units sold."
            >
              <div className="space-y-4 p-6">
                {(report?.top_products || []).length ? (
                  report.top_products.map((row) => (
                    <MiniBar
                      key={`${row.product_name}-${row.sku}`}
                      label={`${row.product_name} (${row.sku || "-"})`}
                      value={row.units_sold}
                      max={productMax}
                      suffix=" units"
                    />
                  ))
                ) : (
                  <EmptyState text="No product sales found." />
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Sales by Channel"
              description="Walk-in, WhatsApp, delivery, and online sales."
            >
              <div className="space-y-4 p-6">
                {(report?.channel_breakdown || []).length ? (
                  report.channel_breakdown.map((row) => (
                    <MiniBar
                      key={row.channel}
                      label={labelize(row.channel)}
                      value={money(row.total_sales)}
                      max={channelMax}
                    />
                  ))
                ) : (
                  <EmptyState text="No channel data found." />
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Payment Breakdown"
              description="Payment method performance."
            >
              <div className="space-y-4 p-6">
                {(report?.payment_breakdown || []).length ? (
                  report.payment_breakdown.map((row) => (
                    <MiniBar
                      key={row.payment_method}
                      label={labelize(row.payment_method)}
                      value={money(row.total_amount)}
                      max={paymentMax}
                    />
                  ))
                ) : (
                  <EmptyState text="No payment data found." />
                )}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Low Stock Products"
            description="Products below or equal to low stock threshold."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Threshold</th>
                    <th className="px-6 py-4">Sale Price</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(report?.low_stock_products || []).length ? (
                    report.low_stock_products.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-950">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.sku || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.category_name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">
                            {item.stock_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {item.low_stock_threshold}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-950">
                          {money(item.sale_price)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <TableEmpty colSpan={5} text="No low stock products." />
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard
              title="Rider Performance"
              description="Delivery and COD performance by rider."
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Rider</th>
                      <th className="px-6 py-4">Assigned</th>
                      <th className="px-6 py-4">Delivered</th>
                      <th className="px-6 py-4">Failed</th>
                      <th className="px-6 py-4">Pending COD</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {(report?.rider_performance || []).length ? (
                      report.rider_performance.map((rider) => (
                        <tr key={rider.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-black text-slate-950">
                              {rider.rider_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {rider.rider_phone || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {rider.assigned_orders || 0}
                          </td>
                          <td className="px-6 py-4 font-bold text-emerald-700">
                            {rider.delivered_orders || 0}
                          </td>
                          <td className="px-6 py-4 font-bold text-red-700">
                            {rider.failed_orders || 0}
                          </td>
                          <td className="px-6 py-4 font-black text-slate-950">
                            {money(rider.pending_cod)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <TableEmpty colSpan={5} text="No rider data found." />
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard
              title="Top Customers"
              description="Customers with highest spend."
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Orders</th>
                      <th className="px-6 py-4">Spent</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {(report?.top_customers || []).length ? (
                      report.top_customers.map((customer, index) => (
                        <tr
                          key={`${customer.customer_id || "walkin"}-${index}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-black text-slate-950">
                            {customer.customer_name}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {customer.customer_phone || "-"}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {customer.orders_count || 0}
                          </td>
                          <td className="px-6 py-4 font-black text-slate-950">
                            {money(customer.total_spent)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <TableEmpty colSpan={4} text="No customer data found." />
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Promotion Performance"
            description="Coupon and promotion usage summary."
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Promotion</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Used</th>
                    <th className="px-6 py-4">Total Discount</th>
                    <th className="px-6 py-4">Generated Sales</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(report?.promotion_summary || []).length ? (
                    report.promotion_summary.map((promo) => (
                      <tr key={promo.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black text-slate-950">
                          {promo.name}
                        </td>
                        <td className="px-6 py-4">
                          {promo.code ? (
                            <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                              {promo.code}
                            </span>
                          ) : (
                            <span className="text-slate-400">AUTO</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {promo.discount_type === "percentage"
                            ? `${Number(promo.discount_value || 0)}%`
                            : money(promo.discount_value)}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {promo.used_count || 0}
                        </td>
                        <td className="px-6 py-4 font-black text-red-700">
                          {money(promo.total_discount)}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-950">
                          {money(promo.generated_sales)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <TableEmpty colSpan={6} text="No promotion usage found." />
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}

function TableEmpty({ colSpan, text }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-10 text-center text-sm font-semibold text-slate-500"
      >
        {text}
      </td>
    </tr>
  );
}