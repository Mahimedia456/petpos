function cleanUrl(url) {
  return String(url || "").trim().replace(/\/+$/, "");
}

function buildAuthHeader(consumerKey, consumerSecret) {
  const token = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  return `Basic ${token}`;
}

export async function getWooSettings(pool) {
  const result = await pool.query(`
    select *
    from woocommerce_settings
    order by created_at asc
    limit 1
  `);

  if (result.rows.length) return result.rows[0];

  const created = await pool.query(`
    insert into woocommerce_settings (
      sync_products_enabled,
      sync_orders_enabled,
      push_stock_enabled,
      is_connected
    )
    values (true, true, true, false)
    returning *
  `);

  return created.rows[0];
}

export function createWooClient(settings) {
  const siteUrl = cleanUrl(settings.site_url);

  if (!siteUrl || !settings.consumer_key || !settings.consumer_secret) {
    throw new Error("WooCommerce credentials are not configured.");
  }

  async function request(path, options = {}) {
    const url = `${siteUrl}/wp-json/wc/v3${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: buildAuthHeader(
          settings.consumer_key,
          settings.consumer_secret
        ),
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await res.text();

    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = {
        raw: text,
      };
    }

    if (!res.ok) {
      const message =
        json?.message ||
        json?.raw ||
        `WooCommerce request failed with ${res.status}`;
      throw new Error(message);
    }

    return json;
  }

  return {
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) =>
      request(path, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    put: (path, body) =>
      request(path, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  };
}

export function normalizeWooProduct(product) {
  const image = Array.isArray(product.images) ? product.images[0] : null;

  return {
    woo_product_id: product.id,
    name: product.name || "WooCommerce Product",
    sku: product.sku || `WOO-${product.id}`,
    barcode: product.sku || null,
    description: product.short_description || product.description || null,
    sale_price: Number(product.sale_price || product.price || 0),
    cost_price: 0,
    stock_quantity:
      product.stock_quantity === null || product.stock_quantity === undefined
        ? 0
        : Number(product.stock_quantity || 0),
    image_url: image?.src || null,
    woo_permalink: product.permalink || null,
    woo_sync_status: "synced",
  };
}

export function normalizeWooOrder(order) {
  const billing = order.billing || {};
  const shipping = order.shipping || {};

  const customerName =
    `${billing.first_name || shipping.first_name || ""} ${
      billing.last_name || shipping.last_name || ""
    }`.trim() || "WooCommerce Customer";

  const customerPhone = billing.phone || shipping.phone || null;
  const deliveryAddress = [
    shipping.address_1 || billing.address_1,
    shipping.address_2 || billing.address_2,
    shipping.city || billing.city,
    shipping.state || billing.state,
    shipping.postcode || billing.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    woo_order_id: order.id,
    woo_order_number: order.number || String(order.id),
    woo_status: order.status || null,

    channel: "online",
    status:
      order.status === "completed"
        ? "completed"
        : order.status === "cancelled"
          ? "cancelled"
          : "pending",

    payment_status:
      order.status === "completed" || order.status === "processing"
        ? "paid"
        : "unpaid",

    customer_name: customerName,
    customer_phone: customerPhone,
    delivery_address: deliveryAddress || null,

    subtotal: Number(order.total || 0),
    discount_amount: Number(order.discount_total || 0),
    delivery_fee: Number(order.shipping_total || 0),
    total_amount: Number(order.total || 0),

    notes: order.customer_note || null,
    woo_sync_status: "synced",
  };
}