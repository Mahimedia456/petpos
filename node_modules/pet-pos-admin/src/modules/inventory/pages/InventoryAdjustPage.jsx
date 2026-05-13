import { useEffect, useMemo, useState } from "react";
import apiFetch from "../../../lib/apiFetch";

const MOVEMENT_TYPES = [
  { value: "stock_in", label: "Stock In / Purchase" },
  { value: "stock_out", label: "Stock Out" },
  { value: "adjustment", label: "Manual Adjustment" },
  { value: "return", label: "Customer Return" },
  { value: "expired", label: "Expired Stock" },
  { value: "damage", label: "Damaged Stock" },
];

export default function InventoryAdjustPage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    product_id: "",
    movement_type: "stock_in",
    quantity: "",
    reason: "",
  });

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === form.product_id);
  }, [products, form.product_id]);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      const res = await apiFetch("/admin/products");
      const json = await res.json();

      if (json?.ok) {
        setProducts(json.data || []);
      }
    } catch (error) {
      console.error("[loadProducts]", error);
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const res = await apiFetch("/admin/inventory/adjust-stock", {
        method: "POST",
        body: JSON.stringify({
          product_id: form.product_id,
          movement_type: form.movement_type,
          quantity: Number(form.quantity),
          reason: form.reason,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to adjust stock.");
        return;
      }

      setMessage(
        `Stock updated successfully. Previous: ${json.data.previous_stock}, New: ${json.data.new_stock}`
      );

      setForm({
        product_id: "",
        movement_type: "stock_in",
        quantity: "",
        reason: "",
      });

      await loadProducts();
    } catch (error) {
      console.error("[handleSubmit]", error);
      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
          Inventory
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">
          Adjust Stock
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Add purchase stock, remove damaged/expired stock, or make manual
          corrections.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Product
              </label>
              <select
                value={form.product_id}
                onChange={(e) => updateField("product_id", e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              >
                <option value="">
                  {loadingProducts ? "Loading products..." : "Select product"}
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} — Stock: {product.stock_quantity || 0}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Movement Type
              </label>
              <select
                value={form.movement_type}
                onChange={(e) => updateField("movement_type", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              >
                {MOVEMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Quantity
              </label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
                required
                placeholder={
                  form.movement_type === "adjustment"
                    ? "Use positive or negative value"
                    : "Enter quantity"
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />
              {form.movement_type === "adjustment" ? (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Manual adjustment allows negative values. Example: -3 or 10.
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Reason / Note
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => updateField("reason", e.target.value)}
                rows={4}
                placeholder="Example: New supplier purchase, damaged package, expiry cleanup..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />
            </div>

            {message ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Stock Adjustment"}
            </button>
          </div>
        </form>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Selected Product
          </h2>

          {selectedProduct ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">Product</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  {selectedProduct.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Current Stock
                  </p>
                  <h3 className="mt-1 text-3xl font-black text-slate-950">
                    {selectedProduct.stock_quantity || 0}
                  </h3>
                </div>

                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Threshold
                  </p>
                  <h3 className="mt-1 text-3xl font-black text-slate-950">
                    {selectedProduct.low_stock_threshold || 0}
                  </h3>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">SKU</p>
                <p className="mt-1 font-bold text-slate-950">
                  {selectedProduct.sku || "No SKU"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Select a product to view current stock details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}