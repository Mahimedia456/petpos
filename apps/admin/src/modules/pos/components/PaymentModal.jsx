function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

export default function PaymentModal({
  open,
  loading,
  payment,
  total,
  onClose,
  onChange,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Payment
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Complete Checkout
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Collect payment and complete POS order.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-bold text-slate-300">Payable Amount</p>
          <h3 className="mt-2 text-4xl font-black">{money(total)}</h3>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Customer Name
            </label>
            <input
              value={payment.customer_name}
              onChange={(e) => onChange("customer_name", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Customer Phone
            </label>
            <input
              value={payment.customer_phone}
              onChange={(e) => onChange("customer_phone", e.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Payment Method
            </label>
            <select
              value={payment.payment_method}
              onChange={(e) => onChange("payment_method", e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black outline-none focus:border-slate-950"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Payment Reference
            </label>
            <input
              value={payment.payment_reference}
              onChange={(e) => onChange("payment_reference", e.target.value)}
              placeholder="Optional"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-slate-950 px-7 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Processing..." : "Complete Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}