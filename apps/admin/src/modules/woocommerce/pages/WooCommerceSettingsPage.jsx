import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const EMPTY_FORM = {
  site_url: "",
  consumer_key: "",
  consumer_secret: "",
  sync_products_enabled: true,
  sync_orders_enabled: true,
  push_stock_enabled: true,
};

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

export default function WooCommerceSettingsPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
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

      const res = await apiFetch("/admin/woocommerce/settings");
      const json = await res.json();

      if (json?.ok) {
        const s = json.data;

        setForm({
          site_url: s.site_url || "",
          consumer_key: s.consumer_key || "",
          consumer_secret: s.consumer_secret || "",
          sync_products_enabled: Boolean(s.sync_products_enabled),
          sync_orders_enabled: Boolean(s.sync_orders_enabled),
          push_stock_enabled: Boolean(s.push_stock_enabled),
        });
      }
    } catch (error) {
      console.error("[WooCommerceSettingsPage]", error);
      setMessage("Failed to load WooCommerce settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch("/admin/woocommerce/settings", {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save settings.");
        return;
      }

      setMessage("WooCommerce settings saved successfully.");
      setForm((prev) => ({
        ...prev,
        consumer_secret: json.data.consumer_secret || prev.consumer_secret,
      }));
    } catch (error) {
      console.error("[saveSettings]", error);
      setMessage("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    try {
      setTesting(true);
      setMessage("");

      const res = await apiFetch("/admin/woocommerce/test-connection", {
        method: "POST",
      });

      const json = await res.json();

      setMessage(json?.message || "Connection test finished.");
    } catch (error) {
      console.error("[testConnection]", error);
      setMessage("Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading WooCommerce settings...
      </div>
    );
  }

  return (
    <form onSubmit={saveSettings} className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <Link
            to="/woocommerce"
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to WooCommerce
          </Link>

          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-purple-500">
            WordPress Integration
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            WooCommerce Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Connect your WordPress WooCommerce website using API credentials.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          API Credentials
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add your WooCommerce REST API keys from WordPress admin.
        </p>

        <div className="mt-6 grid gap-5">
          <Field
            label="WooCommerce Site URL"
            helper="Example: https://yourpetstore.com"
          >
            <TextInput
              value={form.site_url}
              onChange={(e) => updateField("site_url", e.target.value)}
              placeholder="https://yourstore.com"
            />
          </Field>

          <Field label="Consumer Key">
            <TextInput
              value={form.consumer_key}
              onChange={(e) => updateField("consumer_key", e.target.value)}
              placeholder="ck_xxxxxxxxx"
            />
          </Field>

          <Field
            label="Consumer Secret"
            helper="If already saved, leave masked value unchanged."
          >
            <TextInput
              type="password"
              value={form.consumer_secret}
              onChange={(e) => updateField("consumer_secret", e.target.value)}
              placeholder="cs_xxxxxxxxx"
            />
          </Field>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          Sync Controls
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enable or disable specific WooCommerce sync behavior.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Toggle
            checked={form.sync_products_enabled}
            onChange={(value) => updateField("sync_products_enabled", value)}
            label="Enable product sync"
          />

          <Toggle
            checked={form.sync_orders_enabled}
            onChange={(value) => updateField("sync_orders_enabled", value)}
            label="Enable order import"
          />

          <Toggle
            checked={form.push_stock_enabled}
            onChange={(value) => updateField("push_stock_enabled", value)}
            label="Enable stock push"
          />
        </div>
      </div>
    </form>
  );
}