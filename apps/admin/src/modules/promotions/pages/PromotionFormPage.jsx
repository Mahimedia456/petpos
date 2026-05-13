import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_FORM = {
  name: "",
  code: "",
  description: "",
  promotion_type: "coupon",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "0",
  max_discount_amount: "",
  applies_to: "cart",
  product_id: "",
  category_id: "",
  usage_limit: "",
  per_customer_limit: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 16);
}

export default function PromotionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadOptions() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiFetch("/admin/products"),
        apiFetch("/admin/categories"),
      ]);

      const productsJson = await productsRes.json();
      const categoriesJson = await categoriesRes.json();

      if (productsJson?.ok) {
        setProducts(productsJson.data || []);
      }

      if (categoriesJson?.ok) {
        setCategories(categoriesJson.data || []);
      }
    } catch (error) {
      console.error("[loadOptions]", error);
    }
  }

  async function loadPromotion() {
    if (!isEdit) return;

    try {
      setLoading(true);

      const res = await apiFetch(`/admin/promotions/${id}`);
      const json = await res.json();

      if (json?.ok) {
        const p = json.data.promotion;

        setForm({
          name: p.name || "",
          code: p.code || "",
          description: p.description || "",
          promotion_type: p.promotion_type || "coupon",
          discount_type: p.discount_type || "percentage",
          discount_value: p.discount_value ?? "",
          min_order_amount: p.min_order_amount ?? "0",
          max_discount_amount: p.max_discount_amount ?? "",
          applies_to: p.applies_to || "cart",
          product_id: p.product_id || "",
          category_id: p.category_id || "",
          usage_limit: p.usage_limit ?? "",
          per_customer_limit: p.per_customer_limit ?? "",
          start_date: toDateInput(p.start_date),
          end_date: toDateInput(p.end_date),
          is_active: Boolean(p.is_active),
        });
      }
    } catch (error) {
      console.error("[loadPromotion]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
    loadPromotion();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        ...form,
        code: String(form.code || "").toUpperCase().replace(/\s+/g, ""),
      };

      const res = await apiFetch(
        isEdit ? `/admin/promotions/${id}` : "/admin/promotions",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save promotion.");
        return;
      }

      navigate(`/promotions/${isEdit ? id : json.data.id}`);
    } catch (error) {
      console.error("[handleSubmit]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading promotion...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to={isEdit ? `/promotions/${id}` : "/promotions"}
          className="text-sm font-black text-slate-500 hover:text-slate-950"
        >
          ← Back
        </Link>

        <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
          Sales Engine
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {isEdit ? "Edit Promotion" : "Create Promotion"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Configure coupon codes, automatic discounts, product/category
          promotions, usage limits, and date validity.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Promotion Name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              placeholder="Summer Sale 10%"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Promotion Type
            </label>
            <select
              value={form.promotion_type}
              onChange={(e) => updateField("promotion_type", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            >
              <option value="coupon">Coupon Code</option>
              <option value="automatic">Automatic Discount</option>
              <option value="bogo">BOGO</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Coupon Code
            </label>
            <input
              value={form.code}
              onChange={(e) =>
                updateField(
                  "code",
                  e.target.value.toUpperCase().replace(/\s+/g, "")
                )
              }
              placeholder="PET10"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase outline-none focus:border-slate-950"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Required for coupon promotions. Optional for automatic rules.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Status
            </label>
            <label className="flex h-[46px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="h-5 w-5 rounded border-slate-300"
              />
              <span className="text-sm font-black text-slate-700">
                Promotion is active
              </span>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Discount Type
            </label>
            <select
              value={form.discount_type}
              onChange={(e) => updateField("discount_type", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Discount Value
            </label>
            <input
              type="number"
              step="0.01"
              value={form.discount_value}
              onChange={(e) => updateField("discount_value", e.target.value)}
              required
              placeholder={form.discount_type === "percentage" ? "10" : "500"}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Minimum Order Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={form.min_order_amount}
              onChange={(e) =>
                updateField("min_order_amount", e.target.value)
              }
              placeholder="0"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Max Discount Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={form.max_discount_amount}
              onChange={(e) =>
                updateField("max_discount_amount", e.target.value)
              }
              placeholder="Optional"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Applies To
            </label>
            <select
              value={form.applies_to}
              onChange={(e) => updateField("applies_to", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            >
              <option value="cart">Whole Cart</option>
              <option value="product">Specific Product</option>
              <option value="category">Specific Category</option>
            </select>
          </div>

          {form.applies_to === "product" ? (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Product
              </label>
              <select
                value={form.product_id}
                onChange={(e) => updateField("product_id", e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.applies_to === "category" ? (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Category
              </label>
              <select
                value={form.category_id}
                onChange={(e) => updateField("category_id", e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Usage Limit
            </label>
            <input
              type="number"
              value={form.usage_limit}
              onChange={(e) => updateField("usage_limit", e.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Per Customer Limit
            </label>
            <input
              type="number"
              value={form.per_customer_limit}
              onChange={(e) =>
                updateField("per_customer_limit", e.target.value)
              }
              placeholder="Optional"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Start Date
            </label>
            <input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => updateField("start_date", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              End Date
            </label>
            <input
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => updateField("end_date", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={4}
              placeholder="Promotion internal note..."
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to={isEdit ? `/promotions/${id}` : "/promotions"}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Promotion"}
          </button>
        </div>
      </form>
    </div>
  );
}