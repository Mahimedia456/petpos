import { useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Camera,
  Keyboard,
  RefreshCcw,
  ScanBarcode,
  Search,
  X,
} from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  checkoutPosOrder,
  getPosCategories,
  getPosProducts,
  scanPosBarcode,
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

function getErrorMessage(err, fallback) {
  if (err?.response?.status === 401) {
    return "Session expired. Please login again.";
  }

  return err?.response?.data?.message || err?.message || fallback;
}

function normalizeReceiptData(data) {
  const order = data?.order || data;

  if (!order?.id) {
    return null;
  }

  return {
    order: {
      ...order,
      id: order.id,
      order_id: order.id,
      order_number: order.order_number || order.order_no,
      order_no: order.order_no || order.order_number,
      total_amount: Number(order.total_amount || order.grand_total || 0),
      grand_total: Number(order.grand_total || order.total_amount || 0),
      subtotal: Number(order.subtotal || 0),
      discount_total: Number(order.discount_total || order.discount_amount || 0),
      discount_amount: Number(order.discount_amount || order.discount_total || 0),
      tax_total: Number(order.tax_total || 0),
      delivery_fee: Number(order.delivery_fee || 0),
    },
    items: data?.items || [],
    payments: data?.payments || (data?.payment ? [data.payment] : []),
  };
}

export default function POSPage() {
  const scannerInputRef = useRef(null);
  const videoRef = useRef(null);
  const cameraControlsRef = useRef(null);
  const cameraStartingRef = useRef(false);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanMode, setScanMode] = useState("type");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState("");

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");

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

      if (res?.data?.ok) {
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

      if (res?.data?.ok) {
        setProducts(res.data.data || []);
      } else {
        setProducts([]);
        setError(res?.data?.message || "Failed to load products.");
      }
    } catch (err) {
      console.error("POS products error:", err);
      setProducts([]);
      setError(getErrorMessage(err, "Failed to load products."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();

    setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 300);

    return () => {
      stopCameraScan();
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  useEffect(() => {
    if (!cameraOpen) return;

    const timer = setTimeout(() => {
      startCameraScan();
    }, 350);

    return () => clearTimeout(timer);
  }, [cameraOpen]);

  function addToCart(product) {
    const price = Number(product.sale_price || product.selling_price || 0);
    const stockQty = Number(product.stock_qty || product.stock_quantity || 0);

    if (stockQty <= 0) {
      setScanMessage("Product is out of stock.");
      return;
    }

    setCart((prev) => {
      const exists = prev.find((item) => String(item.id) === String(product.id));

      if (exists) {
        if (exists.qty + 1 > stockQty) {
          setScanMessage("Cannot add more. Stock limit reached.");
          return prev;
        }

        setScanMessage(`${product.name} quantity increased.`);

        return prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, qty: item.qty + 1, stock_qty: stockQty }
            : item
        );
      }

      setScanMessage(`${product.name} added to cart.`);

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          price,
          stock_qty: stockQty,
          qty: 1,
        },
      ];
    });
  }

  async function scanBarcodeNow(value) {
    const code = String(value || "").trim();

    if (!code) return false;

    setScanLoading(true);
    setError("");
    setScanMessage("");

    try {
      const res = await scanPosBarcode(code);

      if (res?.data?.ok && res.data.data) {
        addToCart(res.data.data);
        setBarcodeInput("");
        await loadProducts();
        return true;
      }

      setScanMessage(res?.data?.message || "No product found.");
      return false;
    } catch (err) {
      console.error("Barcode scan error:", err);

      const message =
        err?.response?.status === 404
          ? "No product found for this barcode."
          : getErrorMessage(err, "Barcode scan failed.");

      setScanMessage(message);
      return false;
    } finally {
      setScanLoading(false);

      setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 100);
    }
  }

  function handleBarcodeSubmit(e) {
    e.preventDefault();
    scanBarcodeNow(barcodeInput);
  }

  function handleBarcodeKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      scanBarcodeNow(barcodeInput);
    }
  }

  function openCamera() {
    setScanMode("camera");
    setCameraError("");
    setCameraOpen(true);
  }

  async function startCameraScan() {
    if (cameraStartingRef.current) return;
    if (!videoRef.current) return;

    cameraStartingRef.current = true;
    setCameraLoading(true);
    setCameraError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported in this browser.");
      }

      const codeReader = new BrowserMultiFormatReader();

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!devices.length) {
        throw new Error("No camera device found.");
      }

      const backCamera =
        devices.find((device) =>
          String(device.label || "").toLowerCase().includes("back")
        ) || devices[0];

      const controls = await codeReader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current,
        async (result) => {
          if (!result) return;

          const scannedCode = result.getText();

          if (!scannedCode) return;

          stopCameraScan();
          setCameraOpen(false);
          setBarcodeInput(scannedCode);

          await scanBarcodeNow(scannedCode);
        }
      );

      cameraControlsRef.current = controls;
    } catch (error) {
      console.error("Camera scan error:", error);

      setCameraError(
        error?.message ||
          "Camera failed to open. Please allow camera permission or type barcode manually."
      );
    } finally {
      cameraStartingRef.current = false;
      setCameraLoading(false);
    }
  }

  function stopCameraScan() {
    try {
      if (cameraControlsRef.current) {
        cameraControlsRef.current.stop();
        cameraControlsRef.current = null;
      }

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks?.().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error("Stop camera error:", error);
    }
  }

  function closeCamera() {
    stopCameraScan();
    setCameraOpen(false);

    setTimeout(() => {
      scannerInputRef.current?.focus();
    }, 150);
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
    setScanMessage("");
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
        channel: "walk_in",
        payment_method: payment.payment_method,
        payment_reference: payment.payment_reference || "",
        discount_total: Number(discount || 0),
        tax_total: 0,
        delivery_fee: 0,
        notes: "POS checkout",
        items: cart.map((item) => ({
          product_id: item.id,
          qty: item.qty,
          quantity: item.qty,
          unit_price: item.price,
          discount: 0,
        })),
      };

      const res = await checkoutPosOrder(payload);

      if (res?.data?.ok) {
        const normalizedReceipt = normalizeReceiptData(res.data.data);

        if (!normalizedReceipt?.order?.id) {
          throw new Error("Checkout completed, but order ID was not returned.");
        }

        setReceipt(normalizedReceipt);
        setPaymentOpen(false);
        setReceiptOpen(true);
        clearCart();
        await loadProducts();
        return;
      }

      setError(res?.data?.message || "Checkout failed.");
    } catch (err) {
      console.error("Checkout error:", err);
      setError(getErrorMessage(err, "Checkout failed."));
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
                Scan with barcode device, type manually, or use camera scanner.
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
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                setScanMode("type");
                scannerInputRef.current?.focus();
              }}
              className={
                scanMode === "type"
                  ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                  : "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
              }
            >
              <Keyboard size={17} />
              Type
            </button>

            <button
              type="button"
              onClick={() => {
                setScanMode("device");
                scannerInputRef.current?.focus();
              }}
              className={
                scanMode === "device"
                  ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                  : "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
              }
            >
              <ScanBarcode size={17} />
              Device
            </button>

            <button
              type="button"
              onClick={openCamera}
              className={
                scanMode === "camera"
                  ? "inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                  : "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
              }
            >
              <Camera size={17} />
              Camera
            </button>
          </div>

          <form
            onSubmit={handleBarcodeSubmit}
            className="grid gap-3 lg:grid-cols-[1fr_auto]"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <ScanBarcode size={20} className="text-slate-400" />

              <input
                ref={scannerInputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder={
                  scanMode === "device"
                    ? "Use barcode scanner device here..."
                    : "Type barcode / SKU here..."
                }
                className="w-full border-0 bg-transparent text-sm font-black text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={scanLoading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              <ScanBarcode size={17} />
              {scanLoading ? "Scanning..." : "Scan / Add"}
            </button>
          </form>

          {scanMessage ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              {scanMessage}
            </div>
          ) : null}
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

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Camera Barcode Scanner
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Allow camera permission and point camera at the barcode label.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCamera}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {cameraError ? (
                <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {cameraError}
                </div>
              ) : null}

              {cameraLoading ? (
                <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                  Starting camera...
                </div>
              ) : null}

              <div className="overflow-hidden rounded-3xl bg-slate-950">
                <video
                  ref={videoRef}
                  className="h-[420px] w-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeCamera();
                    setScanMode("type");
                  }}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                >
                  Type Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}