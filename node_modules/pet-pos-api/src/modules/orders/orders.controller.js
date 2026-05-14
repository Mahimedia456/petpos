const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
  "refunded",
];

const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "refunded", "failed"];

const CHANNELS = ["walk_in", "whatsapp", "delivery", "online"];

function cleanText(value) {
  return String(value || "").trim();
}

function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function toLimit(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), 300);
}

function buildOrderNumber(row) {
  return row?.order_number || row?.order_no || `ORD-${String(row?.id || "").slice(0, 8).toUpperCase()}`;
}

function normalizeOrder(row) {
  if (!row) return null;

  return {
    ...row,

    order_id: row.id,
    order_no: row.order_no || row.order_number,
    order_number: buildOrderNumber(row),

    source: row.source || row.channel || "walk_in",
    channel: row.channel || row.source || "walk_in",

    subtotal: toNumber(row.subtotal),
    discount_total: toNumber(row.discount_total),
    discount_amount: toNumber(row.discount_amount || row.discount_total),
    tax_total: toNumber(row.tax_total),
    delivery_fee: toNumber(row.delivery_fee),
    grand_total: toNumber(row.grand_total),
    total_amount: toNumber(row.total_amount || row.grand_total),

    items_count: Number(row.items_count || 0),
    units_count: Number(row.units_count || 0),
  };
}

function normalizeItem(row) {
  if (!row) return null;

  return {
    ...row,

    qty: toNumber(row.qty),
    quantity: toNumber(row.quantity || row.qty),

    unit_price: toNumber(row.unit_price),
    purchase_price: toNumber(row.purchase_price),
    discount: toNumber(row.discount),

    line_total: toNumber(row.line_total),
    total_price: toNumber(row.total_price || row.line_total),
  };
}

function normalizePayment(row) {
  if (!row) return null;

  return {
    ...row,

    method: row.method || row.payment_method,
    payment_method: row.payment_method || row.method,

    reference_no: row.reference_no || row.payment_reference || "",
    payment_reference: row.payment_reference || row.reference_no || "",

    amount: toNumber(row.amount),
  };
}

export function getOrders(pool) {
  return async function getOrdersHandler(req, res) {
    try {
      const {
        status,
        payment_status,
        channel,
        search,
        date_from,
        date_to,
      } = req.query;

      const limit = toLimit(req.query.limit, 100);
      const params = [];
      const where = [];

      if (status && ORDER_STATUSES.includes(status)) {
        params.push(status);
        where.push(`o.status = $${params.length}`);
      }

      if (payment_status && PAYMENT_STATUSES.includes(payment_status)) {
        params.push(payment_status);
        where.push(`o.payment_status = $${params.length}`);
      }

      if (channel && CHANNELS.includes(channel)) {
        params.push(channel);
        where.push(`COALESCE(o.source, 'walk_in') = $${params.length}`);
      }

      if (date_from) {
        params.push(date_from);
        where.push(`o.created_at >= $${params.length}::date`);
      }

      if (date_to) {
        params.push(date_to);
        where.push(`o.created_at < ($${params.length}::date + interval '1 day')`);
      }

      if (search) {
        params.push(`%${cleanText(search)}%`);
        where.push(`
          (
            COALESCE(o.order_no, '') ILIKE $${params.length}
            OR COALESCE(o.customer_name, '') ILIKE $${params.length}
            OR COALESCE(o.customer_phone, '') ILIKE $${params.length}
            OR CAST(o.id AS text) ILIKE $${params.length}
          )
        `);
      }

      params.push(limit);

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const result = await pool.query(
        `
        SELECT
          o.id,
          o.order_no,
          o.order_no AS order_number,
          o.customer_id,
          o.customer_name,
          o.customer_phone,
          COALESCE(o.source, 'walk_in') AS source,
          COALESCE(o.source, 'walk_in') AS channel,
          o.status,
          o.payment_status,
          COALESCE(o.subtotal, 0)::numeric AS subtotal,
          COALESCE(o.discount_total, 0)::numeric AS discount_total,
          COALESCE(o.discount_total, 0)::numeric AS discount_amount,
          COALESCE(o.tax_total, 0)::numeric AS tax_total,
          COALESCE(o.delivery_fee, 0)::numeric AS delivery_fee,
          COALESCE(o.grand_total, 0)::numeric AS grand_total,
          COALESCE(o.grand_total, 0)::numeric AS total_amount,
          o.notes,
          o.created_at,
          o.updated_at,
          COALESCE(COUNT(oi.id), 0)::int AS items_count,
          COALESCE(SUM(oi.qty), 0)::int AS units_count
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        ${whereSql}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT $${params.length}
        `,
        params
      );

      const summaryResult = await pool.query(`
        SELECT
          COUNT(*)::int AS total_orders,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
          COUNT(*) FILTER (WHERE status = 'out_for_delivery')::int AS delivery_orders,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_orders,
          COUNT(*) FILTER (WHERE payment_status = 'unpaid')::int AS unpaid_orders,
          COALESCE(SUM(grand_total), 0)::numeric AS total_sales
        FROM orders
      `);

      res.json({
        ok: true,
        data: {
          summary: {
            ...summaryResult.rows[0],
            total_sales: toNumber(summaryResult.rows[0]?.total_sales),
          },
          orders: result.rows.map(normalizeOrder),
        },
      });
    } catch (error) {
      console.error("[getOrders] error:", error);

      res.status(500).json({
        ok: false,
        message: error.message || "Failed to load orders.",
      });
    }
  };
}

export function getOrderById(pool) {
  return async function getOrderByIdHandler(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          ok: false,
          message: "Order ID is required.",
        });
      }

      const orderResult = await pool.query(
        `
        SELECT
          o.id,
          o.order_no,
          o.order_no AS order_number,
          o.customer_id,
          o.customer_name,
          o.customer_phone,
          COALESCE(o.source, 'walk_in') AS source,
          COALESCE(o.source, 'walk_in') AS channel,
          o.status,
          o.payment_status,
          COALESCE(o.subtotal, 0)::numeric AS subtotal,
          COALESCE(o.discount_total, 0)::numeric AS discount_total,
          COALESCE(o.discount_total, 0)::numeric AS discount_amount,
          COALESCE(o.tax_total, 0)::numeric AS tax_total,
          COALESCE(o.delivery_fee, 0)::numeric AS delivery_fee,
          COALESCE(o.grand_total, 0)::numeric AS grand_total,
          COALESCE(o.grand_total, 0)::numeric AS total_amount,
          o.notes,
          o.created_by,
          o.created_at,
          o.updated_at
        FROM orders o
        WHERE o.id = $1
        LIMIT 1
        `,
        [id]
      );

      if (!orderResult.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Order not found.",
        });
      }

      const order = orderResult.rows[0];

      const itemsResult = await pool.query(
        `
        SELECT
          oi.id,
          oi.order_id,
          oi.product_id,
          COALESCE(oi.product_name, p.name) AS product_name,
          COALESCE(oi.sku, p.sku) AS sku,
          p.barcode,
          COALESCE(oi.qty, 0)::numeric AS qty,
          COALESCE(oi.qty, 0)::numeric AS quantity,
          COALESCE(oi.unit_price, 0)::numeric AS unit_price,
          COALESCE(oi.purchase_price, 0)::numeric AS purchase_price,
          COALESCE(oi.discount, 0)::numeric AS discount,
          COALESCE(oi.line_total, 0)::numeric AS line_total,
          COALESCE(oi.line_total, 0)::numeric AS total_price
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1
        ORDER BY oi.id ASC
        `,
        [id]
      );

      const paymentsResult = await pool.query(
        `
        SELECT
          p.id,
          p.order_id,
          p.method,
          p.method AS payment_method,
          COALESCE(p.amount, 0)::numeric AS amount,
          p.reference_no,
          p.reference_no AS payment_reference,
          p.status,
          p.created_at
        FROM payments p
        WHERE p.order_id = $1
        ORDER BY p.created_at DESC
        `,
        [id]
      );

      res.json({
        ok: true,
        data: {
          order: normalizeOrder(order),
          items: itemsResult.rows.map(normalizeItem),
          payments: paymentsResult.rows.map(normalizePayment),
        },
      });
    } catch (error) {
      console.error("[getOrderById] error:", error);

      res.status(500).json({
        ok: false,
        message: error.message || "Failed to load order detail.",
      });
    }
  };
}

export function updateOrderStatus(pool) {
  return async function updateOrderStatusHandler(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body || {};

      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid order status.",
        });
      }

      const result = await pool.query(
        `
        UPDATE orders
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING
          id,
          order_no,
          order_no AS order_number,
          customer_id,
          customer_name,
          customer_phone,
          COALESCE(source, 'walk_in') AS source,
          COALESCE(source, 'walk_in') AS channel,
          status,
          payment_status,
          COALESCE(subtotal, 0)::numeric AS subtotal,
          COALESCE(discount_total, 0)::numeric AS discount_total,
          COALESCE(discount_total, 0)::numeric AS discount_amount,
          COALESCE(tax_total, 0)::numeric AS tax_total,
          COALESCE(delivery_fee, 0)::numeric AS delivery_fee,
          COALESCE(grand_total, 0)::numeric AS grand_total,
          COALESCE(grand_total, 0)::numeric AS total_amount,
          notes,
          created_at,
          updated_at
        `,
        [status, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Order not found.",
        });
      }

      res.json({
        ok: true,
        message: "Order status updated successfully.",
        data: normalizeOrder(result.rows[0]),
      });
    } catch (error) {
      console.error("[updateOrderStatus] error:", error);

      res.status(500).json({
        ok: false,
        message: error.message || "Failed to update order status.",
      });
    }
  };
}

export function updatePaymentStatus(pool) {
  return async function updatePaymentStatusHandler(req, res) {
    try {
      const { id } = req.params;
      const { payment_status } = req.body || {};

      if (!PAYMENT_STATUSES.includes(payment_status)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid payment status.",
        });
      }

      const result = await pool.query(
        `
        UPDATE orders
        SET payment_status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING
          id,
          order_no,
          order_no AS order_number,
          customer_id,
          customer_name,
          customer_phone,
          COALESCE(source, 'walk_in') AS source,
          COALESCE(source, 'walk_in') AS channel,
          status,
          payment_status,
          COALESCE(subtotal, 0)::numeric AS subtotal,
          COALESCE(discount_total, 0)::numeric AS discount_total,
          COALESCE(discount_total, 0)::numeric AS discount_amount,
          COALESCE(tax_total, 0)::numeric AS tax_total,
          COALESCE(delivery_fee, 0)::numeric AS delivery_fee,
          COALESCE(grand_total, 0)::numeric AS grand_total,
          COALESCE(grand_total, 0)::numeric AS total_amount,
          notes,
          created_at,
          updated_at
        `,
        [payment_status, id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Order not found.",
        });
      }

      res.json({
        ok: true,
        message: "Payment status updated successfully.",
        data: normalizeOrder(result.rows[0]),
      });
    } catch (error) {
      console.error("[updatePaymentStatus] error:", error);

      res.status(500).json({
        ok: false,
        message: error.message || "Failed to update payment status.",
      });
    }
  };
}