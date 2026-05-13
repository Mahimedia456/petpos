const demoRows = [
  {
    name: "Premium Cat Food",
    sku: "CAT-FOOD-001",
    stock: 3,
    threshold: 10,
  },
  {
    name: "Dog Treat Pack",
    sku: "DOG-TREAT-004",
    stock: 5,
    threshold: 12,
  },
  {
    name: "Bird Seed Mix",
    sku: "BIRD-SEED-009",
    stock: 2,
    threshold: 8,
  },
];

export default function LowStockTable() {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-lg font-black text-slate-950">Low Stock Alerts</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Products needing restock attention.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {demoRows.map((row) => (
          <div
            key={row.sku}
            className="flex items-center justify-between gap-4 p-5"
          >
            <div>
              <div className="font-black text-slate-950">{row.name}</div>
              <div className="mt-1 text-xs font-bold text-slate-400">
                SKU: {row.sku}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-red-600">
                {row.stock} left
              </div>
              <div className="mt-1 text-xs font-bold text-slate-400">
                Threshold {row.threshold}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}