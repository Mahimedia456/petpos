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

function DeliveryBadge({ value }) {
  const styles = {
    not_assigned: "bg-slate-100 text-slate-700 ring-slate-200",
    assigned: "bg-blue-50 text-blue-700 ring-blue-200",
    picked_up: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    out_for_delivery: "bg-purple-50 text-purple-700 ring-purple-200",
    delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    returned: "bg-orange-50 text-orange-700 ring-orange-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

function CodBadge({ value }) {
  const styles = {
    not_applicable: "bg-slate-100 text-slate-700 ring-slate-200",
    pending: "bg-red-50 text-red-700 ring-red-200",
    received: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    deposited: "bg-blue-50 text-blue-700 ring-blue-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

export default function DeliveriesPage() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [codStatus, setCodStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (deliveryStatus) params.set("delivery_status", deliveryStatus);
      if (codStatus) params.set("cod_status", codStatus);

      const res = await apiFetch(`/admin/delivery/orders?${params.toString()}`);
      const json = await res.json();

      if (json?.ok) {
        setOrders(json.data.orders || []);
        setSummary(json.data.summary || null);
      }
    } catch (error) {
      console.error("[DeliveriesPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadOrders, 250);
    return () => clearTimeout(timer);
  }, [search, deliveryStatus, codStatus]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Delivery Operations
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Delivery Orders & COD
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Assign riders, track delivery progress, and manage cash on delivery
            collection.
          </p>
        </div>

        <Link
          to="/delivery/riders"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Manage Riders
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          title="Delivery Orders"
          value={summary?.total_delivery_orders || 0}
          helper="All delivery channels"
        />
        <StatCard
          title="Not Assigned"
          value={summary?.not_assigned || 0}
          helper="Needs rider"
        />
        <StatCard
          title="Active"
          value={summary?.active_deliveries || 0}
          helper="In progress"
        />
        <StatCard
          title="Delivered"
          value={summary?.delivered || 0}
          helper="Completed"
        />
        <StatCard
          title="Pending COD"
          value={money(summary?.pending_cod)}
          helper="To collect"
        />
        <StatCard
          title="Received COD"
          value={money(summary?.received_cod)}
          helper="Collected"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, phone, address..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 xl:col-span-2"
          />

          <select
            value={deliveryStatus}
            onChange={(e) => setDeliveryStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Delivery Status</option>
            <option value="not_assigned">Not Assigned</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
          </select>

          <select
            value={codStatus}
            onChange={(e) => setCodStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All COD Status</option>
            <option value="not_applicable">Not Applicable</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="deposited">Deposited</option>
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
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Rider</th>
                <th className="px-6 py-4">Delivery</th>
                <th className="px-6 py-4">COD</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading delivery orders...
                  </td>
                </tr>
              ) : orders.length ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {order.order_number}
                      </div>
                      <div className="text-xs capitalize text-slate-500">
                        {labelize(order.channel)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">
                        {order.customer_name || "Customer"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.customer_phone || "-"}
                      </div>
                    </td>

                    <td className="max-w-xs px-6 py-4 text-slate-600">
                      <div className="line-clamp-2">
                        {order.delivery_address || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">
                        {order.rider_name || "Not assigned"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.rider_phone || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <DeliveryBadge value={order.delivery_status} />
                    </td>

                    <td className="px-6 py-4">
                      <CodBadge value={order.cod_status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {money(order.total_amount)}
                      </div>
                      <div className="text-xs text-slate-500">
                        COD {money(order.cod_amount)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/delivery/orders/${order.id}`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No delivery orders found.
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