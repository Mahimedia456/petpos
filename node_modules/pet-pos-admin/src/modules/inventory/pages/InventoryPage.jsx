import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function StatCard({ title, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-black text-slate-950">{value}</h3>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function MovementBadge({ type }) {
  const label = String(type || "").replaceAll("_", " ");

  const styles = {
    stock_in: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    stock_out: "bg-orange-50 text-orange-700 ring-orange-200",
    adjustment: "bg-blue-50 text-blue-700 ring-blue-200",
    sale: "bg-purple-50 text-purple-700 ring-purple-200",
    return: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    expired: "bg-red-50 text-red-700 ring-red-200",
    damage: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${
        styles[type] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {label}
    </span>
  );
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [movements, setMovements] = useState([]);

  async function loadInventory() {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/inventory/overview");
      const json = await res.json();

      if (json?.ok) {
        setSummary(json.data.summary);
        setMovements(json.data.recent_movements || []);
      }
    } catch (error) {
      console.error("[InventoryPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Inventory Control
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Inventory Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Track stock levels, low stock alerts, expiry dates, and product
            movement history.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/inventory/adjust"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
          >
            Adjust Stock
          </Link>
          <Link
            to="/inventory/movements"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Movement History
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">
          Loading inventory...
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Products"
              value={summary?.total_products || 0}
              helper="Active products"
            />
            <StatCard
              title="Total Stock Units"
              value={summary?.total_stock_units || 0}
              helper="Available units"
            />
            <StatCard
              title="Low Stock"
              value={summary?.low_stock_count || 0}
              helper="Needs restock"
            />
            <StatCard
              title="Expiring Soon"
              value={summary?.expiring_soon_count || 0}
              helper="Within 30 days"
            />
            <StatCard
              title="Expired"
              value={summary?.expired_count || 0}
              helper="Past expiry date"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Link
              to="/inventory/low-stock"
              className="rounded-3xl border border-orange-200 bg-orange-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-500">
                Alert
              </p>
              <h3 className="mt-3 text-2xl font-black text-orange-950">
                Low Stock Products
              </h3>
              <p className="mt-2 text-sm text-orange-800">
                View products where stock is below or equal to threshold.
              </p>
            </Link>

            <Link
              to="/inventory/expiry"
              className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-black uppercase tracking-[0.2em] text-red-500">
                Expiry
              </p>
              <h3 className="mt-3 text-2xl font-black text-red-950">
                Expiry Tracking
              </h3>
              <p className="mt-2 text-sm text-red-800">
                Monitor expired and soon-to-expire pet products.
              </p>
            </Link>

            <Link
              to="/inventory/movements"
              className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-500">
                Audit
              </p>
              <h3 className="mt-3 text-2xl font-black text-blue-950">
                Stock Movements
              </h3>
              <p className="mt-2 text-sm text-blue-800">
                Complete stock in, stock out, sale, and adjustment history.
              </p>
            </Link>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Recent Movements
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest inventory activity.
                </p>
              </div>
              <Link
                to="/inventory/movements"
                className="text-sm font-bold text-slate-950 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Previous</th>
                    <th className="px-6 py-4">New</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.length ? (
                    movements.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-950">
                            {item.product_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.sku || item.barcode || "No SKU"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <MovementBadge type={item.movement_type} />
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {item.previous_stock}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-950">
                          {item.new_stock}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-10 text-center text-sm font-semibold text-slate-500"
                      >
                        No inventory movements yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}