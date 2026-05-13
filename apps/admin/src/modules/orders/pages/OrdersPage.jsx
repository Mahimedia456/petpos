import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_OPTIONS = [
  { value: "", label: "All Payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "All Channels" },
  { value: "walk_in", label: "Walk-in" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "delivery", label: "Delivery" },
  { value: "online", label: "Online" },
];

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function StatusBadge({ value }) {
  const styles = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    processing: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    ready: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    out_for_delivery: "bg-purple-50 text-purple-700 ring-purple-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

function PaymentBadge({ value }) {
  const styles = {
    unpaid: "bg-red-50 text-red-700 ring-red-200",
    partial: "bg-orange-50 text-orange-700 ring-orange-200",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

function ChannelBadge({ value }) {
  const styles = {
    walk_in: "bg-slate-100 text-slate-700 ring-slate-200",
    whatsapp: "bg-green-50 text-green-700 ring-green-200",
    delivery: "bg-purple-50 text-purple-700 ring-purple-200",
    online: "bg-blue-50 text-blue-700 ring-blue-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

function StatCard({ title, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-black text-slate-950">{value}</h3>
      {helper ? <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p> : null}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    payment_status: "",
    channel: "",
    date_from: "",
    date_to: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    params.set("limit", "200");

    return params.toString();
  }, [filters]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadOrders() {
    try {
      setLoading(true);
      const res = await apiFetch(`/admin/orders?${queryString}`);
      const json = await res.json();

      if (json?.ok) {
        setOrders(json.data.orders || []);
        setSummary(json.data.summary || null);
      }
    } catch (error) {
      console.error("[OrdersPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [queryString]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Sales Operations
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Order Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage walk-in, WhatsApp, delivery, and online orders with status
            and payment tracking.
          </p>
        </div>

        <Link
          to="/pos"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Open POS
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="Total Orders"
          value={summary?.total_orders || 0}
          helper="All time"
        />
        <StatCard
          title="Pending"
          value={summary?.pending_orders || 0}
          helper="Needs action"
        />
        <StatCard
          title="Delivery"
          value={summary?.delivery_orders || 0}
          helper="Out for delivery"
        />
        <StatCard
          title="Completed"
          value={summary?.completed_orders || 0}
          helper="Finished"
        />
        <StatCard
          title="Unpaid"
          value={summary?.unpaid_orders || 0}
          helper="Payment due"
        />
        <StatCard
          title="Total Sales"
          value={money(summary?.total_sales)}
          helper="Gross orders"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search order/customer/phone..."
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 xl:col-span-2"
          />

          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          >
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={filters.payment_status}
            onChange={(e) => updateFilter("payment_status", e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          >
            {PAYMENT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={filters.channel}
            onChange={(e) => updateFilter("channel", e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          >
            {CHANNEL_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setFilters({
                search: "",
                status: "",
                payment_status: "",
                channel: "",
                date_from: "",
                date_to: "",
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => updateFilter("date_from", e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => updateFilter("date_to", e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-black text-slate-950">Orders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest orders appear first.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {order.order_number}
                      </div>
                      <div className="text-xs text-slate-500">
                        {String(order.id).slice(0, 8)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">
                        {order.customer_name || "Walk-in Customer"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customer_phone || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <ChannelBadge value={order.channel} />
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge value={order.status} />
                    </td>

                    <td className="px-6 py-4">
                      <PaymentBadge value={order.payment_status} />
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {order.items_count || 0} items / {order.units_count || 0} units
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {money(order.total_amount)}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}