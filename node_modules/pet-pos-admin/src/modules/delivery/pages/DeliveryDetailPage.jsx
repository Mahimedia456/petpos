import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}

export default function DeliveryDetailPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [assignForm, setAssignForm] = useState({
    rider_id: "",
    cod_amount: "",
    delivery_notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadOrder() {
    try {
      setLoading(true);

      const res = await apiFetch(`/admin/delivery/orders/${id}`);
      const json = await res.json();

      if (json?.ok) {
        const data = json.data;
        setOrder(data.order);
        setItems(data.items || []);
        setRiders(data.riders || []);

        setAssignForm({
          rider_id: data.order.rider_id || "",
          cod_amount: data.order.cod_amount || data.order.total_amount || "",
          delivery_notes: data.order.delivery_notes || "",
        });
      }
    } catch (error) {
      console.error("[DeliveryDetailPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  function updateAssignField(name, value) {
    setAssignForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function assignRider(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch(`/admin/delivery/orders/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify(assignForm),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to assign rider.");
        return;
      }

      setMessage("Rider assigned successfully.");
      await loadOrder();
    } catch (error) {
      console.error("[assignRider]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function updateDeliveryStatus(delivery_status) {
    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch(`/admin/delivery/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          delivery_status,
          delivery_notes: assignForm.delivery_notes,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to update delivery status.");
        return;
      }

      setMessage("Delivery status updated.");
      await loadOrder();
    } catch (error) {
      console.error("[updateDeliveryStatus]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCodStatus(cod_status) {
    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch(`/admin/delivery/orders/${id}/cod`, {
        method: "PATCH",
        body: JSON.stringify({
          cod_status,
          cod_amount: assignForm.cod_amount,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to update COD status.");
        return;
      }

      setMessage("COD status updated.");
      await loadOrder();
    } catch (error) {
      console.error("[updateCodStatus]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading delivery order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700 shadow-sm">
        Delivery order not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <Link
            to="/delivery/orders"
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to Delivery Orders
          </Link>

          <h1 className="mt-4 text-3xl font-black text-slate-950">
            {order.order_number}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage rider assignment, delivery flow, and COD collection.
          </p>
        </div>

        <Link
          to={`/orders/${order.id}`}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          View Full Order
        </Link>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Delivery Information
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard label="Customer" value={order.customer_name} />
              <InfoCard label="Phone" value={order.customer_phone} />
              <InfoCard label="Channel" value={labelize(order.channel)} />
              <InfoCard label="Total Amount" value={money(order.total_amount)} />
              <InfoCard
                label="Delivery Status"
                value={labelize(order.delivery_status)}
              />
              <InfoCard label="COD Status" value={labelize(order.cod_status)} />
              <InfoCard label="Rider" value={order.rider_name} />
              <InfoCard label="Rider Phone" value={order.rider_phone} />
            </div>

            <div className="mt-4 rounded-3xl bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Delivery Address
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {order.delivery_address || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">
                Order Items
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Unit Price</th>
                    <th className="px-6 py-4">Total</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.length ? (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black text-slate-950">
                          {item.product_name || "Product"}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {item.sku || item.barcode || "-"}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {money(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-950">
                          {money(item.total_price)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center font-semibold text-slate-500"
                      >
                        No order items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <form
            onSubmit={assignRider}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-black text-slate-950">
              Assign Rider
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Rider
                </label>
                <select
                  value={assignForm.rider_id}
                  onChange={(e) =>
                    updateAssignField("rider_id", e.target.value)
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
                >
                  <option value="">Select rider</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} — {rider.phone || "No phone"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  COD Amount
                </label>
                <input
                  type="number"
                  value={assignForm.cod_amount}
                  onChange={(e) =>
                    updateAssignField("cod_amount", e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Delivery Notes
                </label>
                <textarea
                  value={assignForm.delivery_notes}
                  onChange={(e) =>
                    updateAssignField("delivery_notes", e.target.value)
                  }
                  rows={4}
                  placeholder="Delivery instructions..."
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Assign / Update Rider"}
              </button>
            </div>
          </form>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Delivery Status
            </h2>

            <div className="mt-5 grid gap-3">
              {[
                "assigned",
                "picked_up",
                "out_for_delivery",
                "delivered",
                "failed",
                "returned",
              ].map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={saving}
                  onClick={() => updateDeliveryStatus(status)}
                  className={`rounded-2xl px-5 py-3 text-left text-sm font-black ring-1 ${
                    order.delivery_status === status
                      ? "bg-slate-950 text-white ring-slate-950"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {labelize(status)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              COD Collection
            </h2>

            <div className="mt-5 grid gap-3">
              {["pending", "received", "deposited", "not_applicable"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={saving}
                    onClick={() => updateCodStatus(status)}
                    className={`rounded-2xl px-5 py-3 text-left text-sm font-black ring-1 ${
                      order.cod_status === status
                        ? "bg-slate-950 text-white ring-slate-950"
                        : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {labelize(status)}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-xl font-black">Rider WhatsApp</h2>
            <p className="mt-2 text-sm text-slate-300">
              Manual message copy for rider until WhatsApp API is connected.
            </p>

            <textarea
              readOnly
              value={`Delivery assigned: ${order.order_number}
Customer: ${order.customer_name || "-"}
Phone: ${order.customer_phone || "-"}
Address: ${order.delivery_address || "-"}
COD: ${money(assignForm.cod_amount || order.cod_amount || 0)}`}
              className="mt-4 h-40 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white outline-none"
            />

            {order.rider_phone ? (
              <a
                href={`https://wa.me/${String(order.rider_phone).replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Delivery assigned: ${order.order_number}
Customer: ${order.customer_name || "-"}
Phone: ${order.customer_phone || "-"}
Address: ${order.delivery_address || "-"}
COD: ${money(assignForm.cod_amount || order.cod_amount || 0)}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-2xl bg-green-500 px-5 py-3 text-center text-sm font-black text-white hover:bg-green-600"
              >
                Open Rider WhatsApp
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}