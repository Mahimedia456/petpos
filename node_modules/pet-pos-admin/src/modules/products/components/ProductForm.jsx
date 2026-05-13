import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getCategories } from "../../../services/categoryService";

const emptyForm = {
  category_id: "",
  name: "",
  slug: "",
  sku: "",
  barcode: "",
  image_url: "",
  purchase_price: "",
  selling_price: "",
  regular_price: "",
  sale_price: "",
  stock_qty: "",
  low_stock_threshold: "5",
  expiry_date: "",
  is_active: true,
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function ProductForm({
  initialData = null,
  loading = false,
  onSubmit,
}) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res.data?.ok) {
          setCategories(res.data.data || []);
        }
      })
      .catch((err) => {
        console.error("Load categories error:", err);
      });
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        category_id: initialData.category_id || "",
        name: initialData.name || "",
        slug: initialData.slug || "",
        sku: initialData.sku || "",
        barcode: initialData.barcode || "",
        image_url: initialData.image_url || "",
        purchase_price: String(initialData.purchase_price ?? ""),
        selling_price: String(initialData.selling_price ?? ""),
        regular_price: String(initialData.regular_price ?? ""),
        sale_price: String(initialData.sale_price ?? ""),
        stock_qty: String(initialData.stock_qty ?? ""),
        low_stock_threshold: String(initialData.low_stock_threshold ?? "5"),
        expiry_date: initialData.expiry_date
          ? String(initialData.expiry_date).slice(0, 10)
          : "",
        is_active: initialData.is_active !== false,
      });
    }
  }, [initialData]);

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "name" && !initialData) {
        next.slug = slugify(value);
      }

      if (key === "selling_price" && !prev.regular_price) {
        next.regular_price = value;
      }

      return next;
    });
  }

  function submit(e) {
    e.preventDefault();

    onSubmit({
      ...form,
      purchase_price: Number(form.purchase_price || 0),
      selling_price: Number(form.selling_price || 0),
      regular_price: Number(form.regular_price || 0),
      sale_price: Number(form.sale_price || 0),
      stock_qty: Number(form.stock_qty || 0),
      low_stock_threshold: Number(form.low_stock_threshold || 5),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          Basic Information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Product Name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="Premium Cat Food 1kg"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Category
            </label>
            <select
              value={form.category_id}
              onChange={(e) => updateField("category_id", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Slug
            </label>
            <input
              value={form.slug}
              onChange={(e) => updateField("slug", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="premium-cat-food-1kg"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Image URL
            </label>
            <input
              value={form.image_url}
              onChange={(e) => updateField("image_url", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          SKU, Barcode & Pricing
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              SKU
            </label>
            <input
              value={form.sku}
              onChange={(e) => updateField("sku", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="CAT-FOOD-001"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Barcode
            </label>
            <input
              value={form.barcode}
              onChange={(e) => updateField("barcode", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="890100000001"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Purchase Price
            </label>
            <input
              value={form.purchase_price}
              onChange={(e) => updateField("purchase_price", e.target.value)}
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="1800"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Selling Price
            </label>
            <input
              value={form.selling_price}
              onChange={(e) => updateField("selling_price", e.target.value)}
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="2500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Regular Price
            </label>
            <input
              value={form.regular_price}
              onChange={(e) => updateField("regular_price", e.target.value)}
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="2500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Sale Price
            </label>
            <input
              value={form.sale_price}
              onChange={(e) => updateField("sale_price", e.target.value)}
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="2300"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          Inventory Settings
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Stock Quantity
            </label>
            <input
              value={form.stock_qty}
              onChange={(e) => updateField("stock_qty", e.target.value)}
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="25"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Low Stock Threshold
            </label>
            <input
              value={form.low_stock_threshold}
              onChange={(e) =>
                updateField("low_stock_threshold", e.target.value)
              }
              type="number"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              placeholder="5"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Expiry Date
            </label>
            <input
              value={form.expiry_date}
              onChange={(e) => updateField("expiry_date", e.target.value)}
              type="date"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            />
          </div>
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm font-black text-slate-800">
            Product is active and available in POS
          </span>
        </label>
      </div>

      <button
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-60"
      >
        <Save size={18} />
        {loading ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
}