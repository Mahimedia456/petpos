import { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function makeBarcodeValue(product) {
  if (product.barcode) return String(product.barcode);

  if (product.sku) {
    return String(product.sku)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 20);
  }

  return String(product.id || "")
    .replace(/-/g, "")
    .slice(0, 20)
    .toUpperCase();
}

function BarcodeSvg({ value }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !value) return;

    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        width: 1.4,
        height: 40,
        displayValue: true,
        fontSize: 10,
        margin: 4,
      });
    } catch (error) {
      console.error("[BarcodeSvg]", error);
    }
  }, [value]);

  return <svg ref={ref} />;
}

export default function BarcodeLabelsPage() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState("");
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    try {
      setLoading(true);

      const res = await apiFetch("/admin/products");
      const json = await res.json();

      if (json?.ok) {
        setProducts(json.data || []);
      }
    } catch (error) {
      console.error("[BarcodeLabelsPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();

    return products.filter((product) => {
      if (!q) return true;

      return (
        String(product.name || "").toLowerCase().includes(q) ||
        String(product.sku || "").toLowerCase().includes(q) ||
        String(product.barcode || "").toLowerCase().includes(q)
      );
    });
  }, [products, search]);

  const selectedProducts = useMemo(() => {
    return products.filter((product) => selected[product.id]);
  }, [products, selected]);

  function toggleProduct(productId, checked) {
    setSelected((prev) => ({
      ...prev,
      [productId]: checked,
    }));
  }

  function selectAllVisible() {
    const next = { ...selected };

    filteredProducts.forEach((product) => {
      next[product.id] = true;
    });

    setSelected(next);
  }

  function clearSelection() {
    setSelected({});
  }

  function printLabels() {
    if (!selectedProducts.length) {
      alert("Please select products first.");
      return;
    }

    window.print();
  }

  const printableLabels = [];

  selectedProducts.forEach((product) => {
    const count = Math.max(Number(copies || 1), 1);

    for (let i = 0; i < count; i += 1) {
      printableLabels.push(product);
    }
  });

  return (
    <div className="space-y-8">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            #barcode-print-area,
            #barcode-print-area * {
              visibility: visible !important;
            }

            #barcode-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 8mm !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .barcode-grid {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 8px !important;
            }

            .barcode-label {
              page-break-inside: avoid !important;
              border: 1px solid #111 !important;
              border-radius: 8px !important;
              padding: 8px !important;
              min-height: 96px !important;
            }
          }
        `}
      </style>

      <div className="no-print flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Printing
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Barcode Labels
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Select products and print barcode labels for shelf, packaging, or
            inventory scanning.
          </p>
        </div>

        <button
          type="button"
          onClick={printLabels}
          className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Print Labels
        </button>
      </div>

      <div className="no-print grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU, barcode..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />

            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Select Visible
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Select</th>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Barcode</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Stock</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center font-semibold text-slate-500"
                    >
                      Loading products...
                    </td>
                  </tr>
                ) : filteredProducts.length ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={Boolean(selected[product.id])}
                          onChange={(e) =>
                            toggleProduct(product.id, e.target.checked)
                          }
                          className="h-5 w-5 rounded border-slate-300"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-black text-slate-950">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.category_name || "-"}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700">
                        {product.sku || "-"}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700">
                        {makeBarcodeValue(product)}
                      </td>

                      <td className="px-5 py-4 font-black text-slate-950">
                        {money(product.sale_price)}
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-700">
                        {product.stock_quantity || 0}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center font-semibold text-slate-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Print Settings
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Copies per product
              </label>
              <input
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
              />
            </div>

            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Selected Products
              </p>
              <h3 className="mt-2 text-3xl font-black text-slate-950">
                {selectedProducts.length}
              </h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Total labels: {printableLabels.length}
              </p>
            </div>

            <button
              type="button"
              onClick={printLabels}
              className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
            >
              Print Now
            </button>
          </div>
        </aside>
      </div>

      <div
        id="barcode-print-area"
        className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="no-print mb-5">
          <h2 className="text-xl font-black text-slate-950">
            Print Preview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This section will be printed.
          </p>
        </div>

        {printableLabels.length ? (
          <div className="barcode-grid grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {printableLabels.map((product, index) => {
              const barcodeValue = makeBarcodeValue(product);

              return (
                <div
                  key={`${product.id}-${index}`}
                  className="barcode-label rounded-2xl border border-slate-300 bg-white p-3 text-center"
                >
                  <div className="truncate text-sm font-black text-slate-950">
                    {product.name}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    SKU: {product.sku || "-"}
                  </div>

                  <div className="flex justify-center">
                    <BarcodeSvg value={barcodeValue} />
                  </div>

                  <div className="mt-1 text-sm font-black text-slate-950">
                    {money(product.sale_price)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">
            Select products to preview labels.
          </div>
        )}
      </div>
    </div>
  );
}