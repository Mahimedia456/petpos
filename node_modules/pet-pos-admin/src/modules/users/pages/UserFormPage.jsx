import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "cashier",
  status: "active",
  avatar_url: "",
};

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadUser() {
    if (!isEdit) return;

    try {
      setLoading(true);

      const res = await apiFetch(`/admin/users/${id}`);
      const json = await res.json();

      if (json?.ok) {
        const user = json.data;

        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "cashier",
          status: user.status || "active",
          avatar_url: user.avatar_url || "",
        });
      }
    } catch (error) {
      console.error("[loadUser]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch(isEdit ? `/admin/users/${id}` : "/admin/users", {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save user.");
        return;
      }

      navigate("/users");
    } catch (error) {
      console.error("[handleSubmit]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveUser() {
    try {
      setMessage("");

      const res = await apiFetch(`/admin/users/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to archive user.");
        return;
      }

      navigate("/users");
    } catch (error) {
      console.error("[archiveUser]", error);
      setMessage("Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading user...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/users"
          className="text-sm font-black text-slate-500 hover:text-slate-950"
        >
          ← Back to Users
        </Link>

        <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
          Access Control
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {isEdit ? "Edit User" : "Add User"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Create admin, manager, or cashier account and control login status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Full Name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              placeholder="User full name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              required
              placeholder="user@email.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="0300xxxxxxx"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Avatar URL
            </label>
            <input
              value={form.avatar_url}
              onChange={(e) => updateField("avatar_url", e.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-slate-950"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-slate-950"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <div>
            {isEdit ? (
              <button
                type="button"
                onClick={archiveUser}
                className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-700 ring-1 ring-red-200 hover:bg-red-100"
              >
                Archive User
              </button>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Link
              to="/users"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save User"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}