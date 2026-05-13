import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

export default function WhatsAppOrderCreatePage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [cart, setCart] = useState([]);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    delivery_address: "",
    delivery_fee: "0",
    discount_amount: "0",
    payment_method: "cod",
    notes: "",
    whatsapp_message: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [createdMessage, setCreatedMessage] = useState("");

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.unit_price || 0);
    }, 0);
  }, [cart]);

  const deliveryFee = Number(form.delivery_fee || 0);
  const discountAmount = Number(form.discount_amount || 0);
  const total = Math.max(subtotal + deliveryFee - discountAmount, 0);

  async function loadCustomers() {
    try {
      const params = new URLSearchParams();
      if (customerSearch) params.set("search", customerSearch);
      params.set("active", "true");

      const res = await apiFetch(`/admin/customers?${params.toString()}`);
      const json = await res.json();

      if (json?.ok) {
        setCustomers(json.data.customers || []);
      }
    } catch (error) {
      console.error("[loadCustomers]", error);
    }
  }

  async function loadProducts() {
    try {
      const res = await apiFetch("/admin/products");
      const json = await res.json();

      if (json?.ok) {
        setProducts(json.data || []);
      }
    } catch (error) {
      console.error("[loadProducts]", error);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 250);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();

    return products.filter((product) => {
      if (!q) return true;

      return (
        String(product.name || "").toLowerCase().includes(q) ||
        String(product.sku || "").toLowerCase().includes(q) ||
        String(product.barcode || "").toLowerCase().includes(q)
      );
    });
  }, [products, productSearch]);

  function updateField(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setForm((prev) => ({
      ...prev,
      customer_name: customer.name || "",
      customer_phone: customer.phone || "",
      delivery_address: customer.address || "",
    }));
  }

  function addProduct(product) {
    const existing = cart.find((item) => item.product_id === product.id);

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        stock_quantity: product.stock_quantity || 0,
        quantity: 1,
        unit_price: Number(product.sale_price || 0),
      },
    ]);
  }

  function updateCartItem(productId, field, value) {
    setCart((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              [field]:
                field === "quantity"
                  ? Math.max(Number(value || 1), 1)
                  : Number(value || 0),
            }
          : item
      )
    );
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  }

  async function createOrder(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setCreatedMessage("");

      const res = await apiFetch("/admin/whatsapp/orders", {
        method: "POST",
        body: JSON.stringify({
          customer_id: selectedCustomer?.id || null,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          delivery_address: form.delivery_address,
          delivery_fee: Number(form.delivery_fee || 0),
          discount_amount: Number(form.discount_amount || 0),
          payment_method: form.payment_method,
          notes: form.notes,
          whatsapp_message: form.whatsapp_message,
          items: cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to create WhatsApp order.");
        return;
      }

      setCreatedMessage(json.data.whatsapp_message || "");
      setMessage("WhatsApp order created successfully.");

      setTimeout(() => {
        navigate(`/orders/${json.data.order.id}`);
      }, 600);
    } catch (error) {
      console.error("[createOrder]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const whatsappUrl =
    form.customer_phone && createdMessage
      ? `https://wa.me/${String(form.customer_phone).replace(
          /\D/g,
          ""
        )}?text=${encodeURIComponent(createdMessage)}`
      : "";

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/whatsapp/orders"
          className="text-sm font-black text-slate-500 hover:text-slate-950"
        >
          ← Back to WhatsApp Orders
        </Link>

        <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-green-500">
          WhatsApp Sales
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950">
          Create WhatsApp Order
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Create manual order from WhatsApp chat, link customer, add products,
          and generate confirmation message.
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <form onSubmit={createOrder} className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Customer Details
            </h2>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Search Existing Customer
              </label>
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search name, phone, email..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
              />

              {customerSearch ? (
                <div className="mt-3 max-h-56 overflow-auto rounded-2xl border border-slate-200 bg-white">
                  {customers.length ? (
                    customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                      >
                        <div className="font-black text-slate-950">
                          {customer.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {customer.phone || "-"}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                      No customers found.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Customer Name
                </label>
                <input
                  value={form.customer_name}
                  onChange={(e) => updateField("customer_name", e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  WhatsApp Phone
                </label>
                <input
                  value={form.customer_phone}
                  onChange={(e) =>
                    updateField("customer_phone", e.target.value)
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Delivery Address
                </label>
                <textarea
                  value={form.delivery_address}
                  onChange={(e) =>
                    updateField("delivery_address", e.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Products</h2>

            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product, SKU, barcode..."
              className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {filteredProducts.slice(0, 12).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProduct(product)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                >
                  <div className="font-black text-slate-950">
                    {product.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    SKU: {product.sku || "-"} · Stock:{" "}
                    {product.stock_quantity || 0}
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-950">
                    {money(product.sale_price)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">Cart Items</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4 text-right">Remove</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {cart.length ? (
                    cart.map((item) => (
                      <tr key={item.product_id}>
                        <td className="px-6 py-4">
                          <div className="font-black text-slate-950">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.sku || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartItem(
                                item.product_id,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateCartItem(
                                item.product_id,
                                "unit_price",
                                e.target.value
                              )
                            }
                            className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none"
                          />
                        </td>

                        <td className="px-6 py-4 font-black text-slate-950">
                          {money(item.quantity * item.unit_price)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.product_id)}
                            className="rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-700 ring-1 ring-red-200"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center text-sm font-semibold text-slate-500"
                      >
                        No cart items yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Order Summary
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Payment Method
                </label>
                <select
                  value={form.payment_method}
                  onChange={(e) =>
                    updateField("payment_method", e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none"
                >
                  <option value="cod">COD</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="jazzcash">JazzCash</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Delivery Fee
                </label>
                <input
                  type="number"
                  value={form.delivery_fee}
                  onChange={(e) => updateField("delivery_fee", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Discount
                </label>
                <input
                  type="number"
                  value={form.discount_amount}
                  onChange={(e) =>
                    updateField("discount_amount", e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none"
                />
              </div>

              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
                placeholder="Internal order notes..."
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none"
              />

              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm font-semibold text-slate-600">
                  <span>Delivery</span>
                  <span>{money(deliveryFee)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm font-semibold text-slate-600">
                  <span>Discount</span>
                  <span>- {money(discountAmount)}</span>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex justify-between">
                    <span className="font-black text-slate-950">Total</span>
                    <span className="text-2xl font-black text-slate-950">
                      {money(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !cart.length}
                className="w-full rounded-2xl bg-green-600 px-5 py-4 text-sm font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create WhatsApp Order"}
              </button>
            </div>
          </div>

          {createdMessage ? (
            <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
              <h2 className="text-xl font-black">Confirmation Message</h2>

              <textarea
                readOnly
                value={createdMessage}
                className="mt-4 h-36 w-full resize-none rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-semibold text-white outline-none"
              />

              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block rounded-2xl bg-green-500 px-5 py-3 text-center text-sm font-black text-white hover:bg-green-600"
                >
                  Open WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}
        </aside>
      </form>
    </div>
  );
}