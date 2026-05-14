import { Link } from "react-router-dom";
import { Printer, X } from "lucide-react";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function getOrder(receipt) {
  return receipt?.order || receipt || null;
}

function getItems(receipt) {
  return receipt?.items || [];
}

function getPayments(receipt) {
  if (Array.isArray(receipt?.payments)) return receipt.payments;
  if (receipt?.payment) return [receipt.payment];
  return [];
}

function getOrderId(order) {
  return order?.id || order?.order_id || null;
}

function getOrderNumber(order) {
  return order?.order_number || order?.order_no || "-";
}

function getTotal(order) {
  return Number(order?.total_amount || order?.grand_total || 0);
}

function getItemQty(item) {
  return item?.qty || item?.quantity || 0;
}

function getItemTotal(item) {
  return Number(item?.total_price || item?.line_total || 0);
}

function getPaymentMethod(payment) {
  return payment?.payment_method || payment?.method || "cash";
}

export default function ReceiptPreview({ open, receipt, onClose }) {
  if (!open) return null;

  const order = getOrder(receipt);
  const items = getItems(receipt);
  const payments = getPayments(receipt);

  const orderId = getOrderId(order);
  const orderNumber = getOrderNumber(order);
  const total = getTotal(order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Checkout completed
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Receipt {orderNumber}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Order has been saved successfully.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between gap-4 text-sm">
              <span className="font-bold text-slate-500">Order ID</span>
              <span className="break-all text-right font-black text-slate-950">
                {orderId || "Missing"}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 text-sm">
              <span className="font-bold text-slate-500">Order No</span>
              <span className="text-right font-black text-slate-950">
                {orderNumber}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 text-sm">
              <span className="font-bold text-slate-500">Customer</span>
              <span className="text-right font-black text-slate-950">
                {order?.customer_name || "Walk-in Customer"}
              </span>
            </div>

            <div className="mt-2 flex justify-between gap-4 text-sm">
              <span className="font-bold text-slate-500">Total</span>
              <span className="text-right font-black text-slate-950">
                {money(total)}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {items.length ? (
              items.map((item, index) => (
                <div
                  key={item.id || `${item.product_id || "item"}-${index}`}
                  className="flex justify-between gap-4 rounded-2xl border border-slate-100 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-black text-slate-950">
                      {item.product_name || item.name || "Product"}
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-400">
                      Qty {getItemQty(item)} × {money(item.unit_price)}
                    </div>
                  </div>

                  <div className="shrink-0 font-black text-slate-950">
                    {money(getItemTotal(item))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 p-4 text-center text-sm font-bold text-slate-500">
                No receipt items found.
              </div>
            )}
          </div>

          {payments.length ? (
            <div className="mt-5 rounded-2xl border border-slate-100 p-4">
              <div className="text-sm font-black text-slate-950">Payment</div>

              {payments.map((payment, index) => (
                <div
                  key={payment.id || index}
                  className="mt-2 flex justify-between gap-4 text-sm"
                >
                  <span className="font-bold capitalize text-slate-500">
                    {String(getPaymentMethod(payment)).replaceAll("_", " ")}
                  </span>

                  <span className="font-black text-slate-950">
                    {money(payment.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-6 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          {orderId ? (
            <Link
              to={`/printing/receipt/${orderId}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800"
            >
              <Printer size={17} />
              Print Receipt
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-slate-300 px-5 py-3 text-sm font-black text-white"
            >
              <Printer size={17} />
              Order ID Missing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}