import { Package, Plus } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency";

export default function ProductGrid({ products, loading, onAdd }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-[1.7rem] border border-slate-200 bg-white"
          />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-[1.7rem] border border-dashed border-slate-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Package size={26} />
        </div>

        <h3 className="mt-4 text-lg font-black text-slate-950">
          No products found
        </h3>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Try searching by name, SKU or barcode.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => {
        const price = Number(product.sale_price || product.selling_price || 0);
        const outOfStock = Number(product.stock_qty || 0) <= 0;

        return (
          <button
            key={product.id}
            onClick={() => !outOfStock && onAdd(product)}
            disabled={outOfStock}
            className="group rounded-[1.7rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="mb-4 flex h-32 items-center justify-center rounded-[1.4rem] bg-slate-50">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full rounded-[1.4rem] object-cover"
                />
              ) : (
                <Package size={38} className="text-slate-300" />
              )}
            </div>

            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase text-slate-500">
                {product.category_name || "Product"}
              </span>

              {outOfStock ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-black text-red-700">
                  Out
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700">
                  {product.stock_qty} in stock
                </span>
              )}
            </div>

            <h3 className="min-h-12 text-sm font-black leading-6 text-slate-950">
              {product.name}
            </h3>

            <div className="mt-3 text-xs font-bold text-slate-400">
              SKU: {product.sku || "-"}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-xl font-black text-slate-950">
                  {formatCurrency(price)}
                </div>
                {product.regular_price > price ? (
                  <div className="text-xs font-bold text-slate-400 line-through">
                    {formatCurrency(product.regular_price)}
                  </div>
                ) : null}
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition group-hover:scale-105">
                <Plus size={20} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}