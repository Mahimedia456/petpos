import { useEffect, useState } from "react";
import apiFetch from "../../../lib/apiFetch";

function ExpiryBadge({ status }) {
  if (status === "expired") {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">
        Expired
      </span>
    );
  }

  if (status === "expiring_soon") {
    return (
      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700 ring-1 ring-orange-200">
        Expiring Soon
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
      Safe
    </span>
  );
}

export default function ExpiryTrackingPage() {
  const [items, setItems] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    try {
      setLoading(true);
      const res = await apiFetch(`/admin/inventory/expiry-tracking?days=${days}`);
      const json = await res.json();

      if (json?.ok) {
        setItems(json.data || []);
      }
    } catch (error) {
      console.error("[ExpiryTrackingPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [days]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-red-200 bg-red-50 p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-500">
            Inventory Expiry
          </p>
          <h1 className="mt-2 text-3xl font-black text-red-950">
            Expiry Tracking
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-red-800">
            Track pet food, medicine, treats, and expiry-sensitive products.
          </p>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 outline-none"
        >
          <option value={7}>Next 7 days</option>
          <option value={15}>Next 15 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
        </select>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Price</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading expiry products...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.sku || item.barcode || "No SKU"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.category_name || "-"}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {item.stock_quantity}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-950">
                      {item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <ExpiryBadge status={item.expiry_status} />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      Rs {Number(item.sale_price || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No products with expiry dates found.
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