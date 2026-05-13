import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
];

const PAYMENT_OPTIONS = ["unpaid", "partial", "paid", "refunded"];

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function Badge({ value, type = "status" }) {
  const statusStyles = {
    pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
    processing: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    ready: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    out_for_delivery: "bg-purple-50 text-purple-700 ring-purple-200",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  const paymentStyles = {
    unpaid: "bg-red-50 text-red-700 ring-red-200",
    partial: "bg-orange-50 text-orange-700 ring-orange-200",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    refunded: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  const styles = type === "payment" ? paymentStyles : statusStyles;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-50 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [message, setMessage] = useState("");

  const totals = useMemo(() => {
    const subtotalFromItems = items.reduce(
      (sum, item) => sum + Number(item.total_price || 0),
      0
    );

    return {
      subtotal: Number(order?.subtotal || subtotalFromItems || 0),
      discount: Number(order?.discount_amount || 0),
      delivery: Number(order?.delivery_fee || 0),
      total: Number(order?.total_amount || 0),
    };
  }, [order, items]);

  async function loadOrder() {
    try {
      setLoading(true);

      const res = await apiFetch(`/admin/orders/${id}`);
      const json = await res.json();

      if (json?.ok) {
        setOrder(json.data.order);
        setItems(json.data.items || []);
        setPayments(json.data.payments || []);
      }
    } catch (error) {
      console.error("[OrderDetailPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function updateStatus(status) {
    try {
      setSavingStatus(true);
      setMessage("");

      const res = await apiFetch(`/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to update status.");
        return;
      }

      setOrder(json.data);
      setMessage("Order status updated successfully.");
    } catch (error) {
      console.error("[updateStatus]", error);
      setMessage("Something went wrong.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function updatePaymentStatus(payment_status) {
    try {
      setSavingPayment(true);
      setMessage("");

      const res = await apiFetch(`/admin/orders/${id}/payment-status`, {
        method: "PATCH",
        body: JSON.stringify({ payment_status }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to update payment status.");
        return;
      }

      setOrder(json.data);
      setMessage("Payment status updated successfully.");
    } catch (error) {
      console.error("[updatePaymentStatus]", error);
      setMessage("Something went wrong.");
    } finally {
      setSavingPayment(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading order detail...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700 shadow-sm">
        Order not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <Link
            to="/orders"
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to Orders
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-950">
              {order.order_number}
            </h1>
            <Badge value={order.status} />
            <Badge value={order.payment_status} type="payment" />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Created{" "}
            {order.created_at
              ? new Date(order.created_at).toLocaleString()
              : "-"}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          Print Invoice
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Customer & Delivery
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard
                label="Customer Name"
                value={order.customer_name || "Walk-in Customer"}
              />
              <InfoCard label="Phone" value={order.customer_phone} />
              <InfoCard label="Channel" value={labelize(order.channel)} />
              <InfoCard
                label="Delivery Address"
                value={order.delivery_address}
              />
            </div>

            {order.notes ? (
              <div className="mt-4 rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Notes
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {order.notes}
                </p>
              </div>
            ) : null}
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

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">Payments</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {payments.length ? (
                    payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black capitalize text-slate-950">
                          {labelize(payment.payment_method)}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {money(payment.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge value={payment.status || "paid"} type="payment" />
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-10 text-center font-semibold text-slate-500"
                      >
                        No payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Update Order
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Order Status
                </label>
                <select
                  value={order.status || "pending"}
                  disabled={savingStatus}
                  onChange={(e) => updateStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black capitalize outline-none focus:border-slate-950"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {labelize(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Payment Status
                </label>
                <select
                  value={order.payment_status || "paid"}
                  disabled={savingPayment}
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black capitalize outline-none focus:border-slate-950"
                >
                  {PAYMENT_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {labelize(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Order Summary
            </h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>Subtotal</span>
                <span>{money(totals.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>Discount</span>
                <span>- {money(totals.discount)}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                <span>Delivery Fee</span>
                <span>{money(totals.delivery)}</span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-slate-950">
                    Total
                  </span>
                  <span className="text-2xl font-black text-slate-950">
                    {money(totals.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-xl font-black">WhatsApp Message</h2>
            <p className="mt-2 text-sm text-slate-300">
              Manual message copy for now. WhatsApp Business API integration
              next module mein connect karenge.
            </p>

            <textarea
              readOnly
              value={`Hello ${
                order.customer_name || "Customer"
              }, your order ${order.order_number} is ${labelize(
                order.status
              )}. Total amount is ${money(order.total_amount)}.`}
              className="mt-4 h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white outline-none"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}