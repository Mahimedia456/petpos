import { useEffect, useMemo, useState } from "react";
import { Barcode, RefreshCcw, Search } from "lucide-react";
import {
  checkoutPosOrder,
  getPosCategories,
  getPosProducts,
} from "../../../services/posService";
import ProductGrid from "../components/ProductGrid";
import CartPanel from "../components/CartPanel";
import PaymentModal from "../components/PaymentModal";
import ReceiptPreview from "../components/ReceiptPreview";

const defaultPayment = {
  customer_name: "Walk-in Customer",
  customer_phone: "",
  payment_method: "cash",
  payment_reference: "",
};

export default function POSPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState(defaultPayment);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const grandTotal = Math.max(0, subtotal - Number(discount || 0));

  async function loadCategories() {
    try {
      const res = await getPosCategories();

      if (res.data?.ok) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error("POS categories error:", err);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const res = await getPosProducts({
        search,
        category_id: selectedCategory,
      });

      if (res.data?.ok) {
        setProducts(res.data.data || []);
      }
    } catch (err) {
      console.error("POS products error:", err);
      setError(err.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  function addToCart(product) {
    const price = Number(product.sale_price || product.selling_price || 0);

    setCart((prev) => {
      const exists = prev.find((item) => item.id === product.id);

      if (exists) {
        if (exists.qty + 1 > Number(product.stock_qty || 0)) {
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price,
          stock_qty: Number(product.stock_qty || 0),
          qty: 1,
        },
      ];
    });
  }

  function increaseQty(id) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (item.qty + 1 > item.stock_qty) return item;

        return {
          ...item,
          qty: item.qty + 1,
        };
      })
    );
  }

  function decreaseQty(id) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;

          return {
            ...item,
            qty: item.qty - 1,
          };
        })
        .filter((item) => item.qty > 0)
    );
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
    setDiscount(0);
  }

  function openCheckout() {
    if (!cart.length) return;
    setPayment(defaultPayment);
    setPaymentOpen(true);
  }

  function updatePayment(key, value) {
    setPayment((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function submitCheckout(e) {
    e.preventDefault();

    if (!cart.length) return;

    setCheckoutLoading(true);
    setError("");

    try {
      const payload = {
        customer_name: payment.customer_name || "Walk-in Customer",
        customer_phone: payment.customer_phone || "",
        source: "walk_in",
        payment_method: payment.payment_method,
        payment_reference: payment.payment_reference || "",
        discount_total: Number(discount || 0),
        tax_total: 0,
        delivery_fee: 0,
        notes: "POS checkout",
        items: cart.map((item) => ({
          product_id: item.id,
          qty: item.qty,
          unit_price: item.price,
          discount: 0,
        })),
      };

      const res = await checkoutPosOrder(payload);

      if (res.data?.ok) {
        setReceipt(res.data.data);
        setPaymentOpen(false);
        setReceiptOpen(true);
        clearCart();
        loadProducts();
      } else {
        setError(res.data?.message || "Checkout failed.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.response?.data?.message || "Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="min-w-0 space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <Barcode size={15} />
                POS Checkout
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Fast pet shop checkout
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Search products by name, SKU or barcode. Add to cart and
                complete walk-in payment instantly.
              </p>
            </div>

            <button
              onClick={loadProducts}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800"
            >
              <RefreshCcw size={17} />
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product name, SKU or barcode..."
                className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <ProductGrid products={products} loading={loading} onAdd={addToCart} />
      </section>

      <CartPanel
        cart={cart}
        subtotal={subtotal}
        discount={Number(discount || 0)}
        grandTotal={grandTotal}
        onIncrease={increaseQty}
        onDecrease={decreaseQty}
        onRemove={removeItem}
        onClear={clearCart}
        onCheckout={openCheckout}
      />

      <PaymentModal
        open={paymentOpen}
        loading={checkoutLoading}
        payment={payment}
        total={grandTotal}
        onClose={() => setPaymentOpen(false)}
        onChange={updatePayment}
        onSubmit={submitCheckout}
      />

      <ReceiptPreview
        open={receiptOpen}
        receipt={receipt}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
}