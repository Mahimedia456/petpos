import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function StatCard({ title, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-black text-slate-950">{value}</h3>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ value }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    partial: "bg-orange-50 text-orange-700 ring-orange-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    pending: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

export default function WooCommercePage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadStatus() {
    try {
      setLoading(true);
      setMessage("");

      const res = await apiFetch("/admin/woocommerce/status");
      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to load WooCommerce status.");
        return;
      }

      setStatus(json.data);
    } catch (error) {
      console.error("[WooCommercePage]", error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function testConnection() {
    try {
      setTesting(true);
      setMessage("");

      const res = await apiFetch("/admin/woocommerce/test-connection", {
        method: "POST",
      });

      const json = await res.json();

      setMessage(json?.message || "Connection test finished.");
      await loadStatus();
    } catch (error) {
      console.error("[testConnection]", error);
      setMessage("Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  async function syncProducts() {
    try {
      setSyncingProducts(true);
      setMessage("");

      const res = await apiFetch("/admin/woocommerce/sync-products", {
        method: "POST",
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Product sync failed.");
        return;
      }

      setMessage(
        `Products synced. Success: ${json.data.success_count}, Failed: ${json.data.failed_count}`
      );

      await loadStatus();
    } catch (error) {
      console.error("[syncProducts]", error);
      setMessage("Product sync failed.");
    } finally {
      setSyncingProducts(false);
    }
  }

  async function importOrders() {
    try {
      setSyncingOrders(true);
      setMessage("");

      const res = await apiFetch("/admin/woocommerce/import-orders", {
        method: "POST",
        body: JSON.stringify({
          status: "processing",
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Order import failed.");
        return;
      }

      setMessage(
        `Orders imported. Success: ${json.data.success_count}, Failed: ${json.data.failed_count}`
      );

      await loadStatus();
    } catch (error) {
      console.error("[importOrders]", error);
      setMessage("Order import failed.");
    } finally {
      setSyncingOrders(false);
    }
  }

  const settings = status?.settings || {};
  const products = status?.products || {};
  const orders = status?.orders || {};
  const logs = status?.logs || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-purple-500">
            WordPress Integration
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            WooCommerce Sync
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Sync products, import website orders, and push POS stock back to
            WooCommerce.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/woocommerce/settings"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Settings
          </Link>

          <button
            type="button"
            onClick={testConnection}
            disabled={testing}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
          Loading WooCommerce status...
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Connection"
              value={settings.is_connected ? "Connected" : "Not Connected"}
              helper={settings.site_url || "No site URL"}
            />
            <StatCard
              title="Woo Products"
              value={products.woo_products || 0}
              helper={`${products.synced_products || 0} synced`}
            />
            <StatCard
              title="Woo Orders"
              value={orders.woo_orders || 0}
              helper={`${orders.synced_orders || 0} synced`}
            />
            <StatCard
              title="Last Product Sync"
              value={
                settings.last_product_sync_at
                  ? new Date(settings.last_product_sync_at).toLocaleDateString()
                  : "-"
              }
              helper="Products"
            />
            <StatCard
              title="Last Order Sync"
              value={
                settings.last_order_sync_at
                  ? new Date(settings.last_order_sync_at).toLocaleDateString()
                  : "-"
              }
              helper="Orders"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Product Sync
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Import/update WooCommerce products into POS products table.
              </p>

              <button
                type="button"
                onClick={syncProducts}
                disabled={syncingProducts}
                className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {syncingProducts ? "Syncing..." : "Sync Products"}
              </button>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Order Import
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Import processing website orders into POS order management.
              </p>

              <button
                type="button"
                onClick={importOrders}
                disabled={syncingOrders}
                className="mt-6 w-full rounded-2xl bg-purple-600 px-5 py-4 text-sm font-black text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {syncingOrders ? "Importing..." : "Import Orders"}
              </button>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Stock Push
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Stock push is handled from product detail/product actions after
                Woo product is linked.
              </p>

              <Link
                to="/products"
                className="mt-6 block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Go to Products
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">
                Sync Logs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest WooCommerce sync activity.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Success</th>
                    <th className="px-6 py-4">Failed</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {logs.length ? (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black capitalize text-slate-950">
                          {labelize(log.sync_type)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge value={log.status} />
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {log.message || "-"}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {log.total_count || 0}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-700">
                          {log.success_count || 0}
                        </td>
                        <td className="px-6 py-4 font-bold text-red-700">
                          {log.failed_count || 0}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-10 text-center font-semibold text-slate-500"
                      >
                        No sync logs yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}