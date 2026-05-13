import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  vehicle_type: "",
  vehicle_number: "",
  status: "active",
  notes: "",
};

export default function RiderFormPage() {
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

  async function loadRider() {
    if (!isEdit) return;

    try {
      setLoading(true);

      const res = await apiFetch(`/admin/delivery/riders/${id}`);
      const json = await res.json();

      if (json?.ok) {
        const rider = json.data;

        setForm({
          name: rider.name || "",
          phone: rider.phone || "",
          email: rider.email || "",
          vehicle_type: rider.vehicle_type || "",
          vehicle_number: rider.vehicle_number || "",
          status: rider.status || "active",
          notes: rider.notes || "",
        });
      }
    } catch (error) {
      console.error("[loadRider]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRider();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch(
        isEdit ? `/admin/delivery/riders/${id}` : "/admin/delivery/riders",
        {
          method: isEdit ? "PATCH" : "POST",
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save rider.");
        return;
      }

      navigate("/delivery/riders");
    } catch (error) {
      console.error("[handleSubmit]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveRider() {
    try {
      const res = await apiFetch(`/admin/delivery/riders/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to archive rider.");
        return;
      }

      navigate("/delivery/riders");
    } catch (error) {
      console.error("[archiveRider]", error);
      setMessage("Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading rider...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/delivery/riders"
          className="text-sm font-black text-slate-500 hover:text-slate-950"
        >
          ← Back to Riders
        </Link>

        <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
          Delivery Team
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          {isEdit ? "Edit Rider" : "Add Rider"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Save rider contact, vehicle information, and availability status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Rider Name
            </label>
            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              placeholder="Rider name"
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
              Email
            </label>
            <input
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              type="email"
              placeholder="rider@email.com"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Vehicle Type
            </label>
            <input
              value={form.vehicle_type}
              onChange={(e) => updateField("vehicle_type", e.target.value)}
              placeholder="Bike / Car / Van"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Vehicle Number
            </label>
            <input
              value={form.vehicle_number}
              onChange={(e) => updateField("vehicle_number", e.target.value)}
              placeholder="ABC-123"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={4}
              placeholder="Area, timing, rider instructions..."
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
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
                onClick={archiveRider}
                className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-700 ring-1 ring-red-200 hover:bg-red-100"
              >
                Archive Rider
              </button>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Link
              to="/delivery/riders"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Rider"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}