const RIDER_STATUSES = ["active", "inactive", "on_leave"];

const DELIVERY_STATUSES = [
  "not_assigned",
  "assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
];

const COD_STATUSES = ["not_applicable", "pending", "received", "deposited"];

function cleanText(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function labelOrderNumber(row) {
  if (row.order_number) return row.order_number;
  return `ORD-${String(row.id || "").slice(0, 8).toUpperCase()}`;
}

export function getRiders(pool) {
  return async function (req, res) {
    try {
      const search = cleanText(req.query.search);
      const status = cleanText(req.query.status);

      const params = [];
      const where = [`is_active = true`];

      if (search) {
        params.push(`%${search}%`);
        where.push(`
          (
            name ilike $${params.length}
            or phone ilike $${params.length}
            or vehicle_number ilike $${params.length}
          )
        `);
      }

      if (status && RIDER_STATUSES.includes(status)) {
        params.push(status);
        where.push(`status = $${params.length}`);
      }

      const result = await pool.query(
        `
        select
          r.*,
          coalesce(count(o.id), 0)::int as assigned_orders,
          coalesce(count(o.id) filter (
            where o.delivery_status in ('assigned', 'picked_up', 'out_for_delivery')
          ), 0)::int as active_deliveries,
          coalesce(sum(o.cod_amount) filter (
            where o.cod_status = 'pending'
          ), 0)::numeric as pending_cod
        from delivery_riders r
        left join orders o on o.rider_id = r.id
        where ${where.join(" and ")}
        group by r.id
        order by r.created_at desc
        limit 300
        `,
        params
      );

      const summaryResult = await pool.query(`
        select
          count(*) filter (where is_active = true)::int as total_riders,
          count(*) filter (where is_active = true and status = 'active')::int as active_riders,
          count(*) filter (where is_active = true and status = 'inactive')::int as inactive_riders,
          count(*) filter (where is_active = true and status = 'on_leave')::int as on_leave_riders
        from delivery_riders
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          riders: result.rows,
        },
      });
    } catch (error) {
      console.error("[getRiders]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load riders.",
      });
    }
  };
}

export function createRider(pool) {
  return async function (req, res) {
    try {
      const body = req.body || {};
      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Rider name is required.",
        });
      }

      const status = RIDER_STATUSES.includes(body.status)
        ? body.status
        : "active";

      const result = await pool.query(
        `
        insert into delivery_riders (
          name,
          phone,
          email,
          vehicle_type,
          vehicle_number,
          status,
          notes
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning *
        `,
        [
          name,
          nullableText(body.phone),
          nullableText(body.email),
          nullableText(body.vehicle_type),
          nullableText(body.vehicle_number),
          status,
          nullableText(body.notes),
        ]
      );

      res.status(201).json({
        ok: true,
        message: "Rider created successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[createRider]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to create rider.",
      });
    }
  };
}

export function getRiderById(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        select *
        from delivery_riders
        where id = $1
        limit 1
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Rider not found.",
        });
      }

      res.json({
        ok: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[getRiderById]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load rider.",
      });
    }
  };
}

export function updateRider(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Rider name is required.",
        });
      }

      const status = RIDER_STATUSES.includes(body.status)
        ? body.status
        : "active";

      const result = await pool.query(
        `
        update delivery_riders
        set
          name = $1,
          phone = $2,
          email = $3,
          vehicle_type = $4,
          vehicle_number = $5,
          status = $6,
          notes = $7,
          updated_at = now()
        where id = $8
        returning *
        `,
        [
          name,
          nullableText(body.phone),
          nullableText(body.email),
          nullableText(body.vehicle_type),
          nullableText(body.vehicle_number),
          status,
          nullableText(body.notes),
          id,
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Rider not found.",
        });
      }

      res.json({
        ok: true,
        message: "Rider updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateRider]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update rider.",
      });
    }
  };
}

export function deleteRider(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        update delivery_riders
        set is_active = false,
            updated_at = now()
        where id = $1
        returning id
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Rider not found.",
        });
      }

      res.json({
        ok: true,
        message: "Rider archived successfully.",
      });
    } catch (error) {
      console.error("[deleteRider]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to archive rider.",
      });
    }
  };
}

export function getDeliveryOrders(pool) {
  return async function (req, res) {
    try {
      const deliveryStatus = cleanText(req.query.delivery_status);
      const codStatus = cleanText(req.query.cod_status);
      const riderId = cleanText(req.query.rider_id);
      const search = cleanText(req.query.search);

      const params = [];
      const where = [`o.channel in ('delivery', 'whatsapp', 'online')`];

      if (deliveryStatus && DELIVERY_STATUSES.includes(deliveryStatus)) {
        params.push(deliveryStatus);
        where.push(`o.delivery_status = $${params.length}`);
      }

      if (codStatus && COD_STATUSES.includes(codStatus)) {
        params.push(codStatus);
        where.push(`o.cod_status = $${params.length}`);
      }

      if (riderId) {
        params.push(riderId);
        where.push(`o.rider_id = $${params.length}`);
      }

      if (search) {
        params.push(`%${search}%`);
        where.push(`
          (
            o.order_number ilike $${params.length}
            or o.customer_name ilike $${params.length}
            or o.customer_phone ilike $${params.length}
            or o.delivery_address ilike $${params.length}
          )
        `);
      }

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
          o.total_amount,
          o.rider_id,
          o.delivery_status,
          o.delivery_notes,
          o.cod_amount,
          o.cod_status,
          o.assigned_at,
          o.picked_up_at,
          o.delivered_at,
          o.created_at,
          r.name as rider_name,
          r.phone as rider_phone
        from orders o
        left join delivery_riders r on r.id = o.rider_id
        where ${where.join(" and ")}
        order by o.created_at desc
        limit 300
        `,
        params
      );

      const summaryResult = await pool.query(`
        select
          count(*) filter (
            where channel in ('delivery', 'whatsapp', 'online')
          )::int as total_delivery_orders,
          count(*) filter (
            where channel in ('delivery', 'whatsapp', 'online')
              and delivery_status = 'not_assigned'
          )::int as not_assigned,
          count(*) filter (
            where channel in ('delivery', 'whatsapp', 'online')
              and delivery_status in ('assigned', 'picked_up', 'out_for_delivery')
          )::int as active_deliveries,
          count(*) filter (
            where channel in ('delivery', 'whatsapp', 'online')
              and delivery_status = 'delivered'
          )::int as delivered,
          coalesce(sum(cod_amount) filter (
            where cod_status = 'pending'
          ), 0)::numeric as pending_cod,
          coalesce(sum(cod_amount) filter (
            where cod_status in ('received', 'deposited')
          ), 0)::numeric as received_cod
        from orders
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          orders: result.rows.map((row) => ({
            ...row,
            order_number: labelOrderNumber(row),
          })),
        },
      });
    } catch (error) {
      console.error("[getDeliveryOrders]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load delivery orders.",
      });
    }
  };
}

export function getDeliveryOrderById(pool) {
  return async function (req, res) {
    try {
      const { orderId } = req.params;

      const orderResult = await pool.query(
        `
        select
          o.*,
          r.name as rider_name,
          r.phone as rider_phone,
          r.vehicle_type,
          r.vehicle_number
        from orders o
        left join delivery_riders r on r.id = o.rider_id
        where o.id = $1
        limit 1
        `,
        [orderId]
      );

      if (!orderResult.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Delivery order not found.",
        });
      }

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
        [orderId]
      );

      const ridersResult = await pool.query(
        `
        select id, name, phone, vehicle_type, vehicle_number
        from delivery_riders
        where is_active = true
          and status = 'active'
        order by name asc
        `
      );

      res.json({
        ok: true,
        data: {
          order: {
            ...orderResult.rows[0],
            order_number: labelOrderNumber(orderResult.rows[0]),
          },
          items: itemsResult.rows,
          riders: ridersResult.rows,
        },
      });
    } catch (error) {
      console.error("[getDeliveryOrderById]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load delivery order.",
      });
    }
  };
}

export function assignDeliveryOrder(pool) {
  return async function (req, res) {
    try {
      const { orderId } = req.params;
      const { rider_id, cod_amount, delivery_notes } = req.body || {};

      if (!rider_id) {
        return res.status(400).json({
          ok: false,
          message: "Rider is required.",
        });
      }

      const riderCheck = await pool.query(
        `
        select id
        from delivery_riders
        where id = $1
          and is_active = true
        limit 1
        `,
        [rider_id]
      );

      if (!riderCheck.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Rider not found.",
        });
      }

      const codAmount = toNumber(cod_amount, 0);

      const result = await pool.query(
        `
        update orders
        set
          rider_id = $1,
          delivery_status = 'assigned',
          cod_amount = $2,
          cod_status = case when $2 > 0 then 'pending' else 'not_applicable' end,
          delivery_notes = $3,
          assigned_at = now(),
          updated_at = now()
        where id = $4
        returning *
        `,
        [rider_id, codAmount, nullableText(delivery_notes), orderId]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Order not found.",
        });
      }

      res.json({
        ok: true,
        message: "Delivery assigned successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[assignDeliveryOrder]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to assign delivery.",
      });
    }
  };
}

export function updateDeliveryStatus(pool) {
  return async function (req, res) {
    try {
      const { orderId } = req.params;
      const { delivery_status, delivery_notes } = req.body || {};

      if (!DELIVERY_STATUSES.includes(delivery_status)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid delivery status.",
        });
      }

      let timestampSql = "";

      if (delivery_status === "picked_up") {
        timestampSql = ", picked_up_at = coalesce(picked_up_at, now())";
      }

      if (delivery_status === "delivered") {
        timestampSql = ", delivered_at = coalesce(delivered_at, now())";
      }

      const result = await pool.query(
        `
        update orders
        set
          delivery_status = $1,
          delivery_notes = coalesce($2, delivery_notes),
          status = case
            when $1 = 'out_for_delivery' then 'out_for_delivery'
            when $1 = 'delivered' then 'completed'
            when $1 = 'returned' then 'cancelled'
            else status
          end,
          updated_at = now()
          ${timestampSql}
        where id = $3
        returning *
        `,
        [delivery_status, nullableText(delivery_notes), orderId]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Order not found.",
        });
      }

      res.json({
        ok: true,
        message: "Delivery status updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateDeliveryStatus]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update delivery status.",
      });
    }
  };
}

export function updateCodStatus(pool) {
  return async function (req, res) {
    try {
      const { orderId } = req.params;
      const { cod_status, cod_amount } = req.body || {};

      if (!COD_STATUSES.includes(cod_status)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid COD status.",
        });
      }

      const result = await pool.query(
        `
        update orders
        set
          cod_status = $1,
          cod_amount = $2,
          payment_status = case
            when $1 in ('received', 'deposited') then 'paid'
            when $1 = 'pending' then 'unpaid'
            else payment_status
          end,
          updated_at = now()
        where id = $3
        returning *
        `,
        [cod_status, toNumber(cod_amount, 0), orderId]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Order not found.",
        });
      }

      res.json({
        ok: true,
        message: "COD status updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateCodStatus]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update COD status.",
      });
    }
  };
}