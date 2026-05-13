export default function Input({ label, error, className = "", ...props }) {
  return (
    <div>
      {label ? (
        <label className="mb-2 block text-sm font-black text-slate-700">
          {label}
        </label>
      ) : null}

      <input
        className={
          "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-purple-100 " +
          className
        }
        {...props}
      />

      {error ? (
        <div className="mt-2 text-xs font-bold text-red-600">{error}</div>
      ) : null}
    </div>
  );
}