import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  whatsapp_opt_in: true,
  notes: "",
};

export default function CustomerFormPage() {
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

  async function loadCustomer() {
    if (!isEdit) return;

    try {
      setLoading(true);
      const res = await apiFetch(`/admin/customers/${id}`);
      const json = await res.json();

      if (json?.ok) {
        const customer = json.data.customer;

        setForm({
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          address: customer.address || "",
          city: customer.city || "",
          whatsapp_opt_in: Boolean(customer.whatsapp_opt_in),
          notes: customer.notes || "",
        });
      }
    } catch (error) {
      console.error("[loadCustomer]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomer();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch(
        isEdit ? `/admin/customers/${id}` : "/admin/customers",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save customer.");
        return;
      }

      const customerId = isEdit ? id : json.data.id;
      navigate(`/customers/${customerId}`);
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
        Loading customer...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to={isEdit ? `/customers/${id}` : "/customers"}
          className="text-sm font-black text-slate-500 hover:text-slate-950"
        >
          ← Back
        </Link>

        <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
          Customer CRM
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {isEdit ? "Edit Customer" : "Add Customer"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Save customer contact details, WhatsApp permission, address, and CRM
          notes.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Customer Name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              placeholder="Example: Aamir Khan"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Phone / WhatsApp
            </label>
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Example: 0300xxxxxxx"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Email
            </label>
            <input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="customer@email.com"
              type="email"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              City
            </label>
            <input
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Karachi"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              rows={3}
              placeholder="Delivery address..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              CRM Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
              placeholder="Customer preferences, recurring needs, delivery instructions..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <input
              type="checkbox"
              checked={form.whatsapp_opt_in}
              onChange={(e) =>
                updateField("whatsapp_opt_in", e.target.checked)
              }
              className="h-5 w-5 rounded border-slate-300"
            />
            <span className="text-sm font-black text-slate-700">
              Customer allows WhatsApp order updates
            </span>
          </label>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Link
            to={isEdit ? `/customers/${id}` : "/customers"}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}