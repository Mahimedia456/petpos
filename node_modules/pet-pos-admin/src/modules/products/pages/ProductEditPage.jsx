import { ArrowLeft, Package } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ProductForm from "../components/ProductForm";
import { getProduct, updateProduct } from "../../../services/productService";

export default function ProductEditPage() {
  const navigate = useNavigate();
  const params = useParams();

  const [product, setProduct] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadProduct() {
    setPageLoading(true);
    setError("");

    try {
      const res = await getProduct(params.id);

      if (res.data?.ok) {
        setProduct(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load product.");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadProduct();
  }, [params.id]);

  async function submitProduct(payload) {
    setSaving(true);
    setError("");

    try {
      const res = await updateProduct(params.id, payload);

      if (res.data?.ok) {
        navigate("/products");
        return;
      }

      setError(res.data?.message || "Failed to update product.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500 shadow-sm">
        Loading product...
      </div>
    );
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
          <Package size={15} />
          Edit Product
        </div>

        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Edit Product
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
          Update product details, pricing, barcode and stock configuration.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <ProductForm
        initialData={product}
        loading={saving}
        onSubmit={submitProduct}
      />
    </div>
  );
}