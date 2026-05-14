import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import JsBarcode from "jsbarcode";
import apiFetch from "../../../lib/apiFetch";
import { getStoreSettings } from "../../../lib/storeSettings";

const fallbackSettings = {
  store_name: "Pet POS Store",
  store_address: "",
  store_phone: "",
  store_email: "",
  currency_symbol: "Rs",
  receipt_show_logo: false,
  logo_url: "",
  receipt_header: "",
  receipt_footer: "Thank you for shopping with us.",
  receipt_show_barcode: true,
};

function money(value, symbol = "Rs") {
  return `${symbol} ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function normalizeOrderData(data) {
  const order = data?.order || data;

  if (!order) {
    return {
      order: null,
      items: [],
      payments: [],
    };
  }

  return {
    order: {
      ...order,
      id: order.id || order.order_id,
      order_number: order.order_number || order.order_no,
      order_no: order.order_no || order.order_number,
      source: order.source || order.channel,
      channel: order.channel || order.source,
      subtotal: Number(order.subtotal || 0),
      discount_amount: Number(order.discount_amount || order.discount_total || 0),
      discount_total: Number(order.discount_total || order.discount_amount || 0),
      delivery_fee: Number(order.delivery_fee || 0),
      total_amount: Number(order.total_amount || order.grand_total || 0),
      grand_total: Number(order.grand_total || order.total_amount || 0),
    },
    items: Array.isArray(data?.items) ? data.items : [],
    payments: Array.isArray(data?.payments)
      ? data.payments
      : data?.payment
        ? [data.payment]
        : [],
  };
}

function getItemQty(item) {
  return item.quantity || item.qty || 0;
}

function getItemTotal(item) {
  return item.total_price || item.line_total || 0;
}

function getPaymentMethod(payment) {
  return payment.payment_method || payment.method || "-";
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
  const params = useParams();
  const location = useLocation();

  const query = new URLSearchParams(location.search);

  const orderId =
    params.orderId ||
    params.id ||
    params.order_id ||
    query.get("orderId") ||
    query.get("id") ||
    query.get("order_id");

  const [settings, setSettings] = useState(fallbackSettings);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadSettingsSafe() {
    try {
      const data = await getStoreSettings();

      return {
        ...fallbackSettings,
        ...(data || {}),
      };
    } catch (error) {
      console.error("[ReceiptPrintPage settings]", error);
      return fallbackSettings;
    }
  }

  async function loadOrderSafe() {
    if (!orderId) {
      throw new Error("Failed to load order ID.");
    }

    const orderRes = await apiFetch(`/admin/orders/${orderId}`);
    const orderJson = await orderRes.json();

    if (!orderRes.ok || !orderJson?.ok) {
      throw new Error(orderJson?.message || "Failed to load order.");
    }

    return normalizeOrderData(orderJson.data);
  }

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const [settingsData, orderData] = await Promise.all([
        loadSettingsSafe(),
        loadOrderSafe(),
      ]);

      setSettings(settingsData);
      setOrder(orderData.order);
      setItems(orderData.items || []);
      setPayments(orderData.payments || []);
    } catch (error) {
      console.error("[ReceiptPrintPage]", error);
      setMessage(error.message || "Something went wrong while loading receipt.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [orderId]);

  const totals = useMemo(() => {
    const subtotalFromItems = items.reduce((sum, item) => {
      return sum + Number(getItemTotal(item) || 0);
    }, 0);

    return {
      subtotal: Number(order?.subtotal || subtotalFromItems || 0),
      discount: Number(order?.discount_amount || order?.discount_total || 0),
      delivery: Number(order?.delivery_fee || 0),
      total: Number(order?.total_amount || order?.grand_total || 0),
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
            to="/pos"
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to POS
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
            <div className="flex justify-between gap-3">
              <span>Receipt</span>
              <span className="text-right">{order.order_number}</span>
            </div>

            <div className="mt-1 flex justify-between gap-3">
              <span>Date</span>
              <span className="text-right">
                {order.created_at
                  ? new Date(order.created_at).toLocaleString()
                  : "-"}
              </span>
            </div>

            <div className="mt-1 flex justify-between gap-3">
              <span>Channel</span>
              <span className="text-right">
                {labelize(order.channel || order.source)}
              </span>
            </div>

            <div className="mt-1 flex justify-between gap-3">
              <span>Customer</span>
              <span className="text-right">
                {order.customer_name || "Walk-in"}
              </span>
            </div>

            {order.customer_phone ? (
              <div className="mt-1 flex justify-between gap-3">
                <span>Phone</span>
                <span className="text-right">{order.customer_phone}</span>
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
                {items.map((item, index) => (
                  <tr
                    key={item.id || `${item.product_id || "item"}-${index}`}
                    className="border-b border-dashed border-slate-200"
                  >
                    <td className="py-2 pr-2">
                      <div className="font-bold">
                        {item.product_name || item.name || "Product"}
                      </div>
                      <div className="text-[10px]">
                        {money(item.unit_price, symbol)} each
                      </div>
                    </td>

                    <td className="py-2 text-center">{getItemQty(item)}</td>

                    <td className="py-2 text-right">
                      {money(getItemTotal(item), symbol)}
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
              payments.map((payment, index) => (
                <div
                  key={payment.id || index}
                  className="mt-1 flex justify-between"
                >
                  <span>{labelize(getPaymentMethod(payment))}</span>
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
            <p className="mt-3 text-center text-xs">
              {settings.receipt_footer}
            </p>
          ) : null}

          <p className="mt-3 text-center text-[10px]">
            Powered by Pet POS System
          </p>
        </div>
      </div>
    </div>
  );
}