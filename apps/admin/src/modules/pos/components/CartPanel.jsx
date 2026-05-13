import { ShoppingCart, Trash2 } from "lucide-react";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

export default function CartPanel({
  cart = [],
  subtotal = 0,
  discount = 0,
  grandTotal = 0,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
  onCheckout,
}) {
  return (
    <aside className="sticky top-[92px] h-fit rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
              <ShoppingCart size={14} />
              Cart
            </div>

            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Current Sale
            </h2>
          </div>

          {cart.length ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-2xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 ring-1 ring-red-100"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto p-5">
        {cart.length ? (
          cart.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-slate-950">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.sku || "No SKU"} · {money(item.price)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-xl bg-white p-2 text-red-600 ring-1 ring-slate-200"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => onDecrease(item.id)}
                    className="h-10 w-10 text-lg font-black text-slate-700"
                  >
                    -
                  </button>

                  <div className="flex h-10 min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-black text-slate-950">
                    {item.qty}
                  </div>

                  <button
                    type="button"
                    onClick={() => onIncrease(item.id)}
                    className="h-10 w-10 text-lg font-black text-slate-700"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">Total</p>
                  <p className="text-sm font-black text-slate-950">
                    {money(item.price * item.qty)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl bg-slate-50 p-8 text-center">
            <ShoppingCart className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 text-sm font-bold text-slate-500">
              Cart is empty.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-5">
        <div className="space-y-3 rounded-3xl bg-slate-50 p-5">
          <div className="flex justify-between text-sm font-bold text-slate-600">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold text-slate-600">
            <span>Discount</span>
            <span>- {money(discount)}</span>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between">
              <span className="text-base font-black text-slate-950">
                Grand Total
              </span>
              <span className="text-2xl font-black text-slate-950">
                {money(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={!cart.length}
          onClick={onCheckout}
          className="mt-4 w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Checkout
        </button>
      </div>
    </aside>
  );
}