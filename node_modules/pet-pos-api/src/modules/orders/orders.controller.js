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

const PAYMENT_STATUSES = ["unpaid", "partial", "paid", "refunded"];

const CHANNELS = ["walk_in", "whatsapp", "delivery", "online"];

function cleanText(value) {
  return String(value || "").trim();
}

function toLimit(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), 300);
}

function buildOrderNumber(row) {
  if (row.order_number) return row.order_number;
  const shortId = String(row.id || "").slice(0, 8).toUpperCase();
  return `ORD-${shortId}`;
}

export function getOrders(pool) {
  return async function (req, res) {
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
        where.push(`o.channel = $${params.length}`);
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
            o.order_number ilike $${params.length}
            or o.customer_name ilike $${params.length}
            or o.customer_phone ilike $${params.length}
            or cast(o.id as text) ilike $${params.length}
          )
        `);
      }

      params.push(limit);

      const whereSql = where.length ? `where ${where.join(" and ")}` : "";

      const result = await pool.query(
        `
        select
          o.id,
          o.order_number,
          o.channel,
          o.status,
          o.payment_status,
          o.customer_name,
          o.customer_phone,
          o.delivery_address,
          o.delivery_fee,
          o.discount_amount,
          o.subtotal,
          o.total_amount,
          o.notes,
          o.created_at,
          o.updated_at,
          coalesce(count(oi.id), 0)::int as items_count,
          coalesce(sum(oi.quantity), 0)::int as units_count
        from orders o
        left join order_items oi on oi.order_id = o.id
        ${whereSql}
        group by o.id
        order by o.created_at desc
        limit $${params.length}
        `,
        params
      );

      const rows = result.rows.map((row) => ({
        ...row,
        order_number: buildOrderNumber(row),
      }));

      const summaryResult = await pool.query(`
        select
          count(*)::int as total_orders,
          count(*) filter (where status = 'pending')::int as pending_orders,
          count(*) filter (where status = 'out_for_delivery')::int as delivery_orders,
          count(*) filter (where status = 'completed')::int as completed_orders,
          count(*) filter (where payment_status = 'unpaid')::int as unpaid_orders,
          coalesce(sum(total_amount), 0)::numeric as total_sales
        from orders
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          orders: rows,
        },
      });
    } catch (error) {
      console.error("[getOrders]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load orders.",
      });
    }
  };
}

export function getOrderById(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const orderResult = await pool.query(
        `
        select
          o.*
        from orders o
        where o.id = $1
        limit 1
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
        select
          oi.id,
          oi.order_id,
          oi.product_id,
          coalesce(oi.product_name, p.name) as product_name,
          coalesce(oi.sku, p.sku) as sku,
          p.barcode,
          oi.quantity,
          oi.unit_price,
          oi.total_price
        from order_items oi
        left join products p on p.id = oi.product_id
        where oi.order_id = $1
        order by oi.id asc
        `,
        [id]
      );

      const paymentsResult = await pool.query(
        `
        select
          id,
          order_id,
          payment_method,
          amount,
          status,
          created_at
        from payments
        where order_id = $1
        order by created_at desc
        `,
        [id]
      );

      res.json({
        ok: true,
        data: {
          order: {
            ...order,
            order_number: buildOrderNumber(order),
          },
          items: itemsResult.rows,
          payments: paymentsResult.rows,
        },
      });
    } catch (error) {
      console.error("[getOrderById]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load order detail.",
      });
    }
  };
}

export function updateOrderStatus(pool) {
  return async function (req, res) {
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
        update orders
        set status = $1,
            updated_at = now()
        where id = $2
        returning *
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
        data: {
          ...result.rows[0],
          order_number: buildOrderNumber(result.rows[0]),
        },
      });
    } catch (error) {
      console.error("[updateOrderStatus]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update order status.",
      });
    }
  };
}

export function updatePaymentStatus(pool) {
  return async function (req, res) {
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
        update orders
        set payment_status = $1,
            updated_at = now()
        where id = $2
        returning *
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
        data: {
          ...result.rows[0],
          order_number: buildOrderNumber(result.rows[0]),
        },
      });
    } catch (error) {
      console.error("[updatePaymentStatus]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update payment status.",
      });
    }
  };
}