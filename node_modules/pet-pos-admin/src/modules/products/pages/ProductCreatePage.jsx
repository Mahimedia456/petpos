import { ArrowLeft, PackagePlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ProductForm from "../components/ProductForm";
import { createProduct } from "../../../services/productService";

export default function ProductCreatePage() {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submitProduct(payload) {
    setSaving(true);
    setError("");

    try {
      const res = await createProduct(payload);

      if (res.data?.ok) {
        navigate("/products");
        return;
      }

      setError(res.data?.message || "Failed to create product.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <button
          onClick={() => navigate("/products")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Back to products
        </button>

        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          <PackagePlus size={15} />
          Create Product
        </div>

        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Add New Product
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
          Add product details, SKU, barcode, pricing and stock quantity for POS.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <ProductForm loading={saving} onSubmit={submitProduct} />
    </div>
  );
}