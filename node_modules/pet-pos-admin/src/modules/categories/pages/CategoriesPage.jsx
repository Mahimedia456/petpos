import { useEffect, useState } from "react";
import {
  Edit3,
  Plus,
  RefreshCcw,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../../services/categoryService";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  is_active: true,
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getErrorMessage(err, fallback) {
  if (err?.response?.status === 401) {
    return "Session expired. Please login again.";
  }

  return err?.response?.data?.message || err?.message || fallback;
}

export default function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const res = await getCategories({ search });

      if (res?.data?.ok) {
        setRows(res.data.data || []);
      } else {
        setRows([]);
        setError(res?.data?.message || "Failed to load categories.");
      }
    } catch (err) {
      setRows([]);
      setError(getErrorMessage(err, "Failed to load categories."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadCategories, 250);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
    setMessage("");
    setError("");
  }

  function openEdit(row) {
    setForm({
      id: row.id,
      name: row.name || "",
      slug: row.slug || "",
      is_active: row.is_active !== false,
    });
    setModalOpen(true);
    setMessage("");
    setError("");
  }

  function updateField(key, value) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "name" && !prev.id) {
        next.slug = slugify(value);
      }

      if (key === "slug") {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  async function saveCategory(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        is_active: form.is_active,
      };

      const res = form.id
        ? await updateCategory(form.id, payload)
        : await createCategory(payload);

      if (res?.data?.ok) {
        setMessage(res.data.message || "Category saved.");
        setModalOpen(false);
        setForm(emptyForm);
        await loadCategories();
      } else {
        setError(res?.data?.message || "Failed to save category.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save category."));
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(row) {
    const yes = window.confirm(`Delete category "${row.name}"?`);

    if (!yes) return;

    setError("");
    setMessage("");

    try {
      const res = await deleteCategory(row.id);

      if (res?.data?.ok) {
        setMessage(res.data.message || "Category deleted.");
        await loadCategories();
      } else {
        setError(res?.data?.message || "Failed to delete category.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete category."));
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <Tags size={15} />
              Product Categories
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Categories
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Manage cat, dog, bird, health, toys and accessories categories
              for POS and WooCommerce sync.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800"
          >
            <Plus size={17} />
            Add Category
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category name or slug..."
              className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={loadCategories}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800"
          >
            <RefreshCcw size={17} />
            Refresh
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Slug</th>
                <th className="px-5 py-4">Products</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-sm font-bold text-slate-500"
                  >
                    Loading categories...
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-4">
                      <div className="font-black text-slate-950">
                        {row.name}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-500">
                      {row.slug}
                    </td>

                    <td className="px-5 py-4 text-sm font-black text-slate-950">
                      {row.products_count || 0}
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
                          onClick={() => openEdit(row)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          onClick={() => removeCategory(row)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-sm font-bold text-slate-500"
                  >
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-5 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {form.id ? "Edit Category" : "Add Category"}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Category will be available in products and POS filters.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveCategory} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">
                  Category Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                  placeholder="Cat Food"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-800">
                  Slug
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                  placeholder="cat-food"
                  required
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-black text-slate-800">
                  Active category
                </span>
              </label>

              <button
                disabled={saving}
                className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Category"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}