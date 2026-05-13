import { Link } from "react-router-dom";
import { Printer } from "lucide-react";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

export default function ReceiptPreview({ open, receipt, onClose }) {
  if (!open || !receipt) return null;

  const order = receipt.order || receipt;
  const items = receipt.items || [];
  const payment = receipt.payment || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Printer size={28} />
          </div>

          <h2 className="mt-4 text-3xl font-black text-slate-950">
            Sale Completed
          </h2>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Order {order.order_no || order.order_number} has been created.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex justify-between text-sm font-bold text-slate-600">
            <span>Order No</span>
            <span>{order.order_no || order.order_number}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm font-bold text-slate-600">
            <span>Customer</span>
            <span>{order.customer_name || "Walk-in Customer"}</span>
          </div>

          <div className="mt-2 flex justify-between text-sm font-bold text-slate-600">
            <span>Payment</span>
            <span>{payment?.method || order.payment_method || "cash"}</span>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="flex justify-between">
              <span className="font-black text-slate-950">Grand Total</span>
              <span className="text-2xl font-black text-slate-950">
                {money(order.grand_total || order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {items.length ? (
          <div className="mt-5 max-h-52 overflow-y-auto rounded-3xl border border-slate-200">
            {items.map((item, index) => (
              <div
                key={`${item.product_id}-${index}`}
                className="flex justify-between border-b border-slate-100 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-black text-slate-950">
                    {item.product_name}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Qty {item.qty || item.quantity} × {money(item.unit_price)}
                  </p>
                </div>

                <p className="font-black text-slate-950">
                  {money(item.line_total || item.total_price)}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {order.id ? (
            <Link
              to={`/printing/receipt/${order.id}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              <Printer size={17} />
              Print Receipt
            </Link>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}