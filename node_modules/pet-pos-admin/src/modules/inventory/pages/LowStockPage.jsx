import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

export default function LowStockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/inventory/low-stock");
      const json = await res.json();

      if (json?.ok) {
        setItems(json.data || []);
      }
    } catch (error) {
      console.error("[LowStockPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-orange-200 bg-orange-50 p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-orange-500">
            Inventory Alert
          </p>
          <h1 className="mt-2 text-3xl font-black text-orange-950">
            Low Stock Products
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-orange-800">
            Products where current stock is below or equal to low stock
            threshold.
          </p>
        </div>

        <Link
          to="/inventory/adjust"
          className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-orange-700"
        >
          Adjust Stock
        </Link>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Threshold</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Expiry</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading low stock products...
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
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">
                        {item.stock_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {item.low_stock_threshold}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      Rs {Number(item.sale_price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.expiry_date
                        ? new Date(item.expiry_date).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No low stock products. Inventory is healthy.
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