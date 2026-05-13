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
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    inactive: "bg-slate-100 text-slate-700 ring-slate-200",
    on_leave: "bg-orange-50 text-orange-700 ring-orange-200",
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

export default function RidersPage() {
  const [riders, setRiders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadRiders() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);

      const res = await apiFetch(`/admin/delivery/riders?${params.toString()}`);
      const json = await res.json();

      if (json?.ok) {
        setRiders(json.data.riders || []);
        setSummary(json.data.summary || null);
      }
    } catch (error) {
      console.error("[RidersPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadRiders, 250);
    return () => clearTimeout(timer);
  }, [search, status]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Delivery Team
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Delivery Riders
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage riders, vehicles, active delivery load, and pending COD
            amounts.
          </p>
        </div>

        <Link
          to="/delivery/riders/new"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Add Rider
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Riders"
          value={summary?.total_riders || 0}
          helper="All active records"
        />
        <StatCard
          title="Active"
          value={summary?.active_riders || 0}
          helper="Available riders"
        />
        <StatCard
          title="Inactive"
          value={summary?.inactive_riders || 0}
          helper="Disabled"
        />
        <StatCard
          title="On Leave"
          value={summary?.on_leave_riders || 0}
          helper="Temporarily away"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rider name, phone, vehicle number..."
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Rider</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Orders</th>
                <th className="px-6 py-4">Active Deliveries</th>
                <th className="px-6 py-4">Pending COD</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading riders...
                  </td>
                </tr>
              ) : riders.length ? (
                riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {rider.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {rider.phone || rider.email || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold capitalize text-slate-700">
                        {rider.vehicle_type || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {rider.vehicle_number || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge value={rider.status} />
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {rider.assigned_orders || 0}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {rider.active_deliveries || 0}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {money(rider.pending_cod)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/delivery/riders/${rider.id}/edit`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No riders found.
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