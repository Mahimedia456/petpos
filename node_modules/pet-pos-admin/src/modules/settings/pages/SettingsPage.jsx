import { useEffect, useState } from "react";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_FORM = {
  store_name: "",
  store_phone: "",
  store_email: "",
  store_address: "",
  store_city: "",

  logo_url: "",

  currency_code: "PKR",
  currency_symbol: "Rs",

  tax_enabled: false,
  tax_rate: "0",

  receipt_header: "",
  receipt_footer: "",
  receipt_show_logo: true,
  receipt_show_barcode: true,

  whatsapp_number: "",
  whatsapp_enabled: true,

  low_stock_default: "5",
  expiry_alert_days: "30",

  delivery_enabled: true,
  default_delivery_fee: "0",
  free_delivery_min_amount: "",

  order_prefix: "ORD",
  whatsapp_order_prefix: "WA",

  timezone: "Asia/Karachi",
};

function Section({ title, description, children }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function Field({ label, children, helper }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>
      {children}
      {helper ? (
        <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
    />
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-slate-300"
      />
      <span className="text-sm font-black text-slate-700">{label}</span>
    </label>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadSettings() {
    try {
      setLoading(true);
      setMessage("");

      const res = await apiFetch("/admin/settings/store");
      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to load settings.");
        return;
      }

      const s = json.data || {};

      setForm({
        store_name: s.store_name || "",
        store_phone: s.store_phone || "",
        store_email: s.store_email || "",
        store_address: s.store_address || "",
        store_city: s.store_city || "",

        logo_url: s.logo_url || "",

        currency_code: s.currency_code || "PKR",
        currency_symbol: s.currency_symbol || "Rs",

        tax_enabled: Boolean(s.tax_enabled),
        tax_rate: s.tax_rate ?? "0",

        receipt_header: s.receipt_header || "",
        receipt_footer: s.receipt_footer || "",
        receipt_show_logo: Boolean(s.receipt_show_logo),
        receipt_show_barcode: Boolean(s.receipt_show_barcode),

        whatsapp_number: s.whatsapp_number || "",
        whatsapp_enabled: Boolean(s.whatsapp_enabled),

        low_stock_default: s.low_stock_default ?? "5",
        expiry_alert_days: s.expiry_alert_days ?? "30",

        delivery_enabled: Boolean(s.delivery_enabled),
        default_delivery_fee: s.default_delivery_fee ?? "0",
        free_delivery_min_amount: s.free_delivery_min_amount ?? "",

        order_prefix: s.order_prefix || "ORD",
        whatsapp_order_prefix: s.whatsapp_order_prefix || "WA",

        timezone: s.timezone || "Asia/Karachi",
      });
    } catch (error) {
      console.error("[loadSettings]", error);
      setMessage("Something went wrong while loading settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch("/admin/settings/store", {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save settings.");
        return;
      }

      setMessage("Store settings saved successfully.");
    } catch (error) {
      console.error("[handleSubmit]", error);
      setMessage("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading store settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            System Configuration
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Store Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Configure store profile, receipt printing, tax, currency,
            WhatsApp, inventory alerts, and delivery defaults.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <Section
        title="Store Profile"
        description="Basic business information used on receipts, invoices, and reports."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Store Name">
            <TextInput
              value={form.store_name}
              onChange={(e) => updateField("store_name", e.target.value)}
              required
              placeholder="Pet POS Store"
            />
          </Field>

          <Field label="Store Phone">
            <TextInput
              value={form.store_phone}
              onChange={(e) => updateField("store_phone", e.target.value)}
              placeholder="0300xxxxxxx"
            />
          </Field>

          <Field label="Store Email">
            <TextInput
              type="email"
              value={form.store_email}
              onChange={(e) => updateField("store_email", e.target.value)}
              placeholder="store@email.com"
            />
          </Field>

          <Field label="City">
            <TextInput
              value={form.store_city}
              onChange={(e) => updateField("store_city", e.target.value)}
              placeholder="Karachi"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Store Address">
              <TextArea
                value={form.store_address}
                onChange={(e) => updateField("store_address", e.target.value)}
                rows={3}
                placeholder="Complete store address..."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field
              label="Logo URL"
              helper="For now use external/public URL. File upload can be added later with Supabase Storage."
            >
              <TextInput
                value={form.logo_url}
                onChange={(e) => updateField("logo_url", e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        title="Currency & Tax"
        description="Used by POS, orders, invoices, and reports."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Currency Code">
            <TextInput
              value={form.currency_code}
              onChange={(e) =>
                updateField("currency_code", e.target.value.toUpperCase())
              }
              placeholder="PKR"
            />
          </Field>

          <Field label="Currency Symbol">
            <TextInput
              value={form.currency_symbol}
              onChange={(e) => updateField("currency_symbol", e.target.value)}
              placeholder="Rs"
            />
          </Field>

          <Toggle
            checked={form.tax_enabled}
            onChange={(value) => updateField("tax_enabled", value)}
            label="Enable tax calculation"
          />

          <Field label="Tax Rate (%)">
            <TextInput
              type="number"
              step="0.01"
              value={form.tax_rate}
              onChange={(e) => updateField("tax_rate", e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Receipt & Invoice"
        description="Receipt content shown after POS checkout and invoice print."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Receipt Header">
              <TextArea
                value={form.receipt_header}
                onChange={(e) => updateField("receipt_header", e.target.value)}
                rows={3}
                placeholder="Thank you for shopping with us."
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Receipt Footer">
              <TextArea
                value={form.receipt_footer}
                onChange={(e) => updateField("receipt_footer", e.target.value)}
                rows={4}
                placeholder="Return/exchange policy..."
              />
            </Field>
          </div>

          <Toggle
            checked={form.receipt_show_logo}
            onChange={(value) => updateField("receipt_show_logo", value)}
            label="Show logo on receipt"
          />

          <Toggle
            checked={form.receipt_show_barcode}
            onChange={(value) => updateField("receipt_show_barcode", value)}
            label="Show barcode / order code on receipt"
          />
        </div>
      </Section>

      <Section
        title="WhatsApp"
        description="Default WhatsApp number and messaging status."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="WhatsApp Number">
            <TextInput
              value={form.whatsapp_number}
              onChange={(e) => updateField("whatsapp_number", e.target.value)}
              placeholder="92300xxxxxxx"
            />
          </Field>

          <Toggle
            checked={form.whatsapp_enabled}
            onChange={(value) => updateField("whatsapp_enabled", value)}
            label="Enable WhatsApp messaging"
          />
        </div>
      </Section>

      <Section
        title="Inventory Alerts"
        description="Default thresholds for stock and expiry tracking."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Default Low Stock Threshold">
            <TextInput
              type="number"
              value={form.low_stock_default}
              onChange={(e) => updateField("low_stock_default", e.target.value)}
              placeholder="5"
            />
          </Field>

          <Field label="Expiry Alert Days">
            <TextInput
              type="number"
              value={form.expiry_alert_days}
              onChange={(e) => updateField("expiry_alert_days", e.target.value)}
              placeholder="30"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Delivery Defaults"
        description="Default delivery fee and free delivery rule."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Toggle
            checked={form.delivery_enabled}
            onChange={(value) => updateField("delivery_enabled", value)}
            label="Enable delivery module"
          />

          <Field label="Default Delivery Fee">
            <TextInput
              type="number"
              step="0.01"
              value={form.default_delivery_fee}
              onChange={(e) =>
                updateField("default_delivery_fee", e.target.value)
              }
              placeholder="0"
            />
          </Field>

          <Field label="Free Delivery Minimum Amount">
            <TextInput
              type="number"
              step="0.01"
              value={form.free_delivery_min_amount}
              onChange={(e) =>
                updateField("free_delivery_min_amount", e.target.value)
              }
              placeholder="Optional"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Order Numbering"
        description="Prefixes used by POS and WhatsApp order creation."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Field label="POS Order Prefix">
            <TextInput
              value={form.order_prefix}
              onChange={(e) =>
                updateField("order_prefix", e.target.value.toUpperCase())
              }
              placeholder="ORD"
            />
          </Field>

          <Field label="WhatsApp Order Prefix">
            <TextInput
              value={form.whatsapp_order_prefix}
              onChange={(e) =>
                updateField(
                  "whatsapp_order_prefix",
                  e.target.value.toUpperCase()
                )
              }
              placeholder="WA"
            />
          </Field>

          <Field label="Timezone">
            <TextInput
              value={form.timezone}
              onChange={(e) => updateField("timezone", e.target.value)}
              placeholder="Asia/Karachi"
            />
          </Field>
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-slate-950 px-8 py-4 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Store Settings"}
        </button>
      </div>
    </form>
  );
}