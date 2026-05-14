import { useEffect, useState } from "react";
import {
  Edit3,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deleteProduct, getProducts } from "../../../services/productService";
import { getCategories } from "../../../services/categoryService";
import { formatCurrency } from "../../../utils/formatCurrency";

function getErrorMessage(err, fallback) {
  if (err?.response?.status === 401) {
    return "Session expired. Please login again.";
  }

  return err?.response?.data?.message || err?.message || fallback;
}

export default function ProductsPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      const res = await getCategories();

      if (res?.data?.ok) {
        setCategories(res.data.data || []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Load categories error:", err);
      setCategories([]);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const res = await getProducts({
        search,
        category_id: categoryId,
        stock_filter: stockFilter,
      });

      if (res?.data?.ok) {
        setRows(res.data.data || []);
      } else {
        setRows([]);
        setError(res?.data?.message || "Failed to load products.");
      }
    } catch (err) {
      setRows([]);
      setError(getErrorMessage(err, "Failed to load products."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 250);
    return () => clearTimeout(timer);
  }, [search, categoryId, stockFilter]);

  async function removeProduct(row) {
    const yes = window.confirm(`Disable product "${row.name}"?`);

    if (!yes) return;

    setMessage("");
    setError("");

    try {
      const res = await deleteProduct(row.id);

      if (res?.data?.ok) {
        setMessage(res.data.message || "Product disabled.");
        await loadProducts();
      } else {
        setError(res?.data?.message || "Failed to disable product.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to disable product."));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <Package size={15} />
              Product Catalog
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Products
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Manage POS products, WooCommerce mapping, SKU, barcode, prices,
              stock and expiry tracking.
            </p>
          </div>

          <button
            onClick={() => navigate("/products/create")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800"
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px_180px_auto]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU or barcode..."
              className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
          >
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          <button
            onClick={loadProducts}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">SKU / Barcode</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-sm font-bold text-slate-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => {
                  const salePrice = Number(
                    row.sale_price || row.selling_price || 0
                  );
                  const lowStock =
                    Number(row.stock_qty || 0) <=
                    Number(row.low_stock_threshold || 0);

                  return (
                    <tr key={row.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                            {row.image_url ? (
                              <img
                                src={row.image_url}
                                alt={row.name}
                                className="h-full w-full rounded-2xl object-cover"
                              />
                            ) : (
                              <Package size={20} className="text-slate-400" />
                            )}
                          </div>

                          <div>
                            <div className="font-black text-slate-950">
                              {row.name}
                            </div>
                            <div className="mt-1 text-xs font-bold text-slate-400">
                              {row.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-black text-slate-950">
                          {row.sku || "-"}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-400">
                          {row.barcode || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                        {row.category_name || "-"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-black text-slate-950">
                          {formatCurrency(salePrice)}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-400">
                          Cost: {formatCurrency(row.purchase_price)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div
                          className={
                            lowStock
                              ? "text-sm font-black text-red-600"
                              : "text-sm font-black text-slate-950"
                          }
                        >
                          {row.stock_qty}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-400">
                          Low at {row.low_stock_threshold}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            row.is_active
                              ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
                              : "rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"
                          }
                        >
                          {row.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/products/${row.id}/edit`)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() => removeProduct(row)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-10 text-center text-sm font-bold text-slate-500"
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}