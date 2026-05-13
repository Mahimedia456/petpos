import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_FORM = {
  id: null,
  name: "",
  template_key: "",
  category: "order",
  message_body: "",
  is_active: true,
};

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTemplates() {
    try {
      setLoading(true);

      const res = await apiFetch("/admin/whatsapp/templates");
      const json = await res.json();

      if (json?.ok) {
        setTemplates(json.data || []);
      }
    } catch (error) {
      console.error("[WhatsAppTemplatesPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function editTemplate(template) {
    setForm({
      id: template.id,
      name: template.name || "",
      template_key: template.template_key || "",
      category: template.category || "order",
      message_body: template.message_body || "",
      is_active: Boolean(template.is_active),
    });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function saveTemplate(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const endpoint = form.id
        ? `/admin/whatsapp/templates/${form.id}`
        : "/admin/whatsapp/templates";

      const res = await apiFetch(endpoint, {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save template.");
        return;
      }

      setMessage(form.id ? "Template updated." : "Template created.");
      resetForm();
      await loadTemplates();
    } catch (error) {
      console.error("[saveTemplate]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function disableTemplate(id) {
    try {
      const res = await apiFetch(`/admin/whatsapp/templates/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to disable template.");
        return;
      }

      setMessage("Template disabled.");
      await loadTemplates();
    } catch (error) {
      console.error("[disableTemplate]", error);
      setMessage("Something went wrong.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/whatsapp/orders"
          className="text-sm font-black text-slate-500 hover:text-slate-950"
        >
          ← Back to WhatsApp Orders
        </Link>

        <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-green-500">
          WhatsApp Messaging
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          WhatsApp Templates
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Manage reusable message templates for order confirmations, delivery
          updates, payment reminders, and customer messages.
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-black text-slate-950">Templates</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Template</th>
                  <th className="px-6 py-4">Key</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center font-semibold text-slate-500"
                    >
                      Loading templates...
                    </td>
                  </tr>
                ) : templates.length ? (
                  templates.map((template) => (
                    <tr key={template.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-950">
                          {template.name}
                        </div>
                        <div className="mt-1 max-w-lg truncate text-xs text-slate-500">
                          {template.message_body}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-700">
                        {template.template_key}
                      </td>

                      <td className="px-6 py-4 font-semibold capitalize text-slate-600">
                        {template.category}
                      </td>

                      <td className="px-6 py-4">
                        {template.is_active ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => editTemplate(template)}
                            className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => disableTemplate(template.id)}
                            className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 ring-1 ring-red-200"
                          >
                            Disable
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center font-semibold text-slate-500"
                    >
                      No templates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form
          onSubmit={saveTemplate}
          className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-black text-slate-950">
            {form.id ? "Edit Template" : "Create Template"}
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Template Key
              </label>
              <input
                value={form.template_key}
                onChange={(e) =>
                  updateField(
                    "template_key",
                    e.target.value.toLowerCase().replace(/\s+/g, "_")
                  )
                }
                required
                placeholder="order_confirmation"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
              >
                <option value="order">Order</option>
                <option value="delivery">Delivery</option>
                <option value="payment">Payment</option>
                <option value="customer">Customer</option>
                <option value="promotion">Promotion</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Message Body
              </label>
              <textarea
                value={form.message_body}
                onChange={(e) => updateField("message_body", e.target.value)}
                required
                rows={8}
                placeholder="Hello {{customer_name}}, your order {{order_number}} is confirmed."
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
                className="h-5 w-5 rounded border-slate-300"
              />
              <span className="text-sm font-black text-slate-700">
                Template is active
              </span>
            </label>

            <div className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
              Available variables:{" "}
              <span className="font-black text-slate-700">
                {"{{customer_name}}, {{order_number}}, {{total_amount}}, {{cod_amount}}, {{rider_name}}"}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : form.id ? "Update" : "Create"}
              </button>

              {form.id ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}