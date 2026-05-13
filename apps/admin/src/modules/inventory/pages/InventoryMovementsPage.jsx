import { useEffect, useState } from "react";
import apiFetch from "../../../lib/apiFetch";

const TYPES = [
  { value: "", label: "All Movements" },
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
  { value: "adjustment", label: "Adjustment" },
  { value: "sale", label: "Sale" },
  { value: "return", label: "Return" },
  { value: "expired", label: "Expired" },
  { value: "damage", label: "Damage" },
];

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

export default function InventoryMovementsPage() {
  const [items, setItems] = useState([]);
  const [movementType, setMovementType] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    try {
      setLoading(true);

      const query = movementType ? `?movement_type=${movementType}` : "";
      const res = await apiFetch(`/admin/inventory/movements${query}`);
      const json = await res.json();

      if (json?.ok) {
        setItems(json.data || []);
      }
    } catch (error) {
      console.error("[InventoryMovementsPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [movementType]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Inventory Audit
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Movement History
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Complete history of stock changes, sales, returns, expiry, and
            damage adjustments.
          </p>
        </div>

        <select
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
        >
          {TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Previous</th>
                <th className="px-6 py-4">New</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading movements...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {item.product_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.sku || item.barcode || "No SKU"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <MovementBadge type={item.movement_type} />
                    </td>
                    <td className="px-6 py-4 font-black text-slate-950">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.previous_stock}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-950">
                      {item.new_stock}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.reason || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No inventory movements found.
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