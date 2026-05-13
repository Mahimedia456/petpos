import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import JsBarcode from "jsbarcode";
import apiFetch from "../../../lib/apiFetch";
import { getStoreSettings } from "../../../lib/storeSettings";

function money(value, symbol = "Rs") {
  return `${symbol} ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function OrderBarcode({ value }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !value) return;

    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        width: 1.2,
        height: 38,
        displayValue: true,
        fontSize: 10,
        margin: 4,
      });
    } catch (error) {
      console.error("[OrderBarcode]", error);
    }
  }, [value]);

  return <svg ref={ref} />;
}

export default function ReceiptPrintPage() {
  const { orderId } = useParams();

  const [settings, setSettings] = useState(null);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [settingsData, orderRes] = await Promise.all([
        getStoreSettings(),
        apiFetch(`/admin/orders/${orderId}`),
      ]);

      const orderJson = await orderRes.json();

      if (!orderJson?.ok) {
        setMessage(orderJson?.message || "Failed to load order.");
        return;
      }

      setSettings(settingsData);
      setOrder(orderJson.data.order);
      setItems(orderJson.data.items || []);
      setPayments(orderJson.data.payments || []);
    } catch (error) {
      console.error("[ReceiptPrintPage]", error);
      setMessage("Something went wrong while loading receipt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [orderId]);

  const totals = useMemo(() => {
    const subtotalFromItems = items.reduce((sum, item) => {
      return sum + Number(item.total_price || 0);
    }, 0);

    return {
      subtotal: Number(order?.subtotal || subtotalFromItems || 0),
      discount: Number(order?.discount_amount || 0),
      delivery: Number(order?.delivery_fee || 0),
      total: Number(order?.total_amount || 0),
    };
  }, [order, items]);

  const symbol = settings?.currency_symbol || "Rs";

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading receipt...
      </div>
    );
  }

  if (message || !order) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700 shadow-sm">
        {message || "Order not found."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }

            body * {
              visibility: hidden !important;
            }

            #receipt-print-area,
            #receipt-print-area * {
              visibility: visible !important;
            }

            #receipt-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              min-height: auto !important;
              padding: 4mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              background: white !important;
              color: black !important;
              font-family: Arial, sans-serif !important;
            }

            .no-print {
              display: none !important;
            }

            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        `}
      </style>

      <div className="no-print flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <Link
            to={`/orders/${order.id}`}
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to Order
          </Link>

          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Receipt
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Print Receipt
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Thermal receipt preview for {order.order_number}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Print Receipt
        </button>
      </div>

      <div className="flex justify-center">
        <div
          id="receipt-print-area"
          className="w-[360px] rounded-[24px] border border-slate-200 bg-white p-5 font-mono text-sm text-slate-950 shadow-sm"
        >
          <div className="text-center">
            {settings?.receipt_show_logo && settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Store logo"
                className="mx-auto mb-3 h-14 w-14 object-contain"
              />
            ) : null}

            <h2 className="text-lg font-black">
              {settings?.store_name || "Pet POS Store"}
            </h2>

            {settings?.store_address ? (
              <p className="mt-1 text-xs">{settings.store_address}</p>
            ) : null}

            <p className="mt-1 text-xs">
              {[settings?.store_phone, settings?.store_email]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {settings?.receipt_header ? (
              <p className="mt-3 border-y border-dashed border-slate-400 py-2 text-xs">
                {settings.receipt_header}
              </p>
            ) : null}
          </div>

          <div className="mt-4 border-b border-dashed border-slate-400 pb-3 text-xs">
            <div className="flex justify-between">
              <span>Receipt</span>
              <span>{order.order_number}</span>
            </div>

            <div className="mt-1 flex justify-between">
              <span>Date</span>
              <span>
                {order.created_at
                  ? new Date(order.created_at).toLocaleString()
                  : "-"}
              </span>
            </div>

            <div className="mt-1 flex justify-between">
              <span>Channel</span>
              <span>{labelize(order.channel)}</span>
            </div>

            <div className="mt-1 flex justify-between">
              <span>Customer</span>
              <span>{order.customer_name || "Walk-in"}</span>
            </div>

            {order.customer_phone ? (
              <div className="mt-1 flex justify-between">
                <span>Phone</span>
                <span>{order.customer_phone}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-dashed border-slate-400">
                  <th className="py-1 text-left">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-dashed border-slate-200">
                    <td className="py-2 pr-2">
                      <div className="font-bold">
                        {item.product_name || "Product"}
                      </div>
                      <div className="text-[10px]">
                        {money(item.unit_price, symbol)} each
                      </div>
                    </td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {money(item.total_price, symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 space-y-1 border-b border-dashed border-slate-400 pb-3 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(totals.subtotal, symbol)}</span>
            </div>

            <div className="flex justify-between">
              <span>Discount</span>
              <span>- {money(totals.discount, symbol)}</span>
            </div>

            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{money(totals.delivery, symbol)}</span>
            </div>

            <div className="mt-2 flex justify-between text-base font-black">
              <span>Total</span>
              <span>{money(totals.total, symbol)}</span>
            </div>
          </div>

          <div className="mt-3 border-b border-dashed border-slate-400 pb-3 text-xs">
            <div className="font-black">Payments</div>

            {payments.length ? (
              payments.map((payment) => (
                <div key={payment.id} className="mt-1 flex justify-between">
                  <span>{labelize(payment.payment_method)}</span>
                  <span>{money(payment.amount, symbol)}</span>
                </div>
              ))
            ) : (
              <div className="mt-1 flex justify-between">
                <span>{labelize(order.payment_status)}</span>
                <span>{money(order.total_amount, symbol)}</span>
              </div>
            )}
          </div>

          {settings?.receipt_show_barcode ? (
            <div className="mt-3 flex justify-center">
              <OrderBarcode value={order.order_number} />
            </div>
          ) : null}

          {settings?.receipt_footer ? (
            <p className="mt-3 text-center text-xs">{settings.receipt_footer}</p>
          ) : null}

          <p className="mt-3 text-center text-[10px]">
            Powered by Pet POS System
          </p>
        </div>
      </div>
    </div>
  );
}