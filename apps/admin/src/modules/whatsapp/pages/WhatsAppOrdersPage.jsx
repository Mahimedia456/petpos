import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function StatCard({ title, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-black text-slate-950">{value}</h3>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ value }) {
  const styles = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    processing: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

export default function WhatsAppOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await apiFetch(`/admin/whatsapp/orders?${params.toString()}`);
      const json = await res.json();

      if (json?.ok) {
        setOrders(json.data.orders || []);
        setSummary(json.data.summary || null);
      }
    } catch (error) {
      console.error("[WhatsAppOrdersPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadOrders, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-green-500">
            WhatsApp Sales
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            WhatsApp Orders
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Create and manage manual WhatsApp orders, customer details,
            delivery status, and COD payments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/whatsapp/templates"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Templates
          </Link>

          <Link
            to="/whatsapp/orders/new"
            className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700"
          >
            Create WhatsApp Order
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="WhatsApp Orders"
          value={summary?.total_whatsapp_orders || 0}
          helper="All time"
        />
        <StatCard
          title="Pending"
          value={summary?.pending_orders || 0}
          helper="Needs confirmation"
        />
        <StatCard
          title="Confirmed"
          value={summary?.confirmed_orders || 0}
          helper="Ready to process"
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
          title="Sales"
          value={money(summary?.total_sales)}
          helper="WhatsApp revenue"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, phone..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Order</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Delivery</th>
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
                    Loading WhatsApp orders...
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
                        {order.whatsapp_source || "manual"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">
                        {order.customer_name || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customer_phone || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {order.items_count || 0} items / {order.units_count || 0} units
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge value={order.status} />
                    </td>

                    <td className="px-6 py-4 font-semibold capitalize text-slate-600">
                      {labelize(order.payment_status)}
                    </td>

                    <td className="px-6 py-4 font-semibold capitalize text-slate-600">
                      {labelize(order.delivery_status)}
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
                        View Order
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
                    No WhatsApp orders found.
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