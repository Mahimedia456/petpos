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

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function buildOrderNumber(row) {
  if (row.order_number) return row.order_number;
  return `ORD-${String(row.id || "").slice(0, 8).toUpperCase()}`;
}

function renderTemplate(template, data = {}) {
  let output = String(template || "");

  Object.entries(data).forEach(([key, value]) => {
    output = output.replaceAll(`{{${key}}}`, String(value ?? ""));
  });

  return output;
}

export function getWhatsAppOrders(pool) {
  return async function (req, res) {
    try {
      const search = cleanText(req.query.search);
      const status = cleanText(req.query.status);

      const params = [];
      const where = [`o.channel = 'whatsapp'`];

      if (search) {
        params.push(`%${search}%`);
        where.push(`
          (
            o.order_number ilike $${params.length}
            or o.customer_name ilike $${params.length}
            or o.customer_phone ilike $${params.length}
          )
        `);
      }

      if (status) {
        params.push(status);
        where.push(`o.status = $${params.length}`);
      }

      const result = await pool.query(
        `
        select
          o.id,
          o.order_number,
          o.customer_id,
          o.customer_name,
          o.customer_phone,
          o.delivery_address,
          o.status,
          o.payment_status,
          o.delivery_status,
          o.cod_status,
          o.subtotal,
          o.discount_amount,
          o.delivery_fee,
          o.total_amount,
          o.whatsapp_source,
          o.whatsapp_message,
          o.created_at,
          coalesce(count(oi.id), 0)::int as items_count,
          coalesce(sum(oi.quantity), 0)::int as units_count
        from orders o
        left join order_items oi on oi.order_id = o.id
        where ${where.join(" and ")}
        group by o.id
        order by o.created_at desc
        limit 300
        `,
        params
      );

      const summaryResult = await pool.query(`
        select
          count(*)::int as total_whatsapp_orders,
          count(*) filter (where status = 'pending')::int as pending_orders,
          count(*) filter (where status = 'confirmed')::int as confirmed_orders,
          count(*) filter (where status = 'completed')::int as completed_orders,
          count(*) filter (where payment_status = 'unpaid')::int as unpaid_orders,
          coalesce(sum(total_amount), 0)::numeric as total_sales
        from orders
        where channel = 'whatsapp'
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          orders: result.rows.map((row) => ({
            ...row,
            order_number: buildOrderNumber(row),
          })),
        },
      });
    } catch (error) {
      console.error("[getWhatsAppOrders]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load WhatsApp orders.",
      });
    }
  };
}

export function createWhatsAppOrder(pool) {
  return async function (req, res) {
    const client = await pool.connect();

    try {
      const body = req.body || {};
      const items = Array.isArray(body.items) ? body.items : [];

      if (!items.length) {
        return res.status(400).json({
          ok: false,
          message: "At least one item is required.",
        });
      }

      const customerName = cleanText(body.customer_name);
      const customerPhone = cleanText(body.customer_phone);

      if (!customerName) {
        return res.status(400).json({
          ok: false,
          message: "Customer name is required.",
        });
      }

      if (!customerPhone) {
        return res.status(400).json({
          ok: false,
          message: "Customer phone is required.",
        });
      }

      await client.query("begin");

      let customerId = body.customer_id || null;

      if (!customerId) {
        const existingCustomer = await client.query(
          `
          select id
          from customers
          where phone = $1
            and is_active = true
          limit 1
          `,
          [customerPhone]
        );

        if (existingCustomer.rows.length) {
          customerId = existingCustomer.rows[0].id;
        } else {
          const customerResult = await client.query(
            `
            insert into customers (
              name,
              phone,
              address,
              whatsapp_opt_in,
              notes
            )
            values ($1, $2, $3, true, $4)
            returning id
            `,
            [
              customerName,
              customerPhone,
              nullableText(body.delivery_address),
              "Created from WhatsApp order",
            ]
          );

          customerId = customerResult.rows[0].id;
        }
      }

      let subtotal = 0;
      const preparedItems = [];

      for (const item of items) {
        const productId = item.product_id;
        const quantity = toInt(item.quantity, 1);

        if (!productId || quantity <= 0) {
          await client.query("rollback");
          return res.status(400).json({
            ok: false,
            message: "Invalid product or quantity.",
          });
        }

        const productResult = await client.query(
          `
          select
            id,
            name,
            sku,
            stock_quantity,
            sale_price
          from products
          where id = $1
            and coalesce(is_active, true) = true
          for update
          `,
          [productId]
        );

        if (!productResult.rows.length) {
          await client.query("rollback");
          return res.status(404).json({
            ok: false,
            message: "Product not found.",
          });
        }

        const product = productResult.rows[0];

        if (Number(product.stock_quantity || 0) < quantity) {
          await client.query("rollback");
          return res.status(400).json({
            ok: false,
            message: `${product.name} has insufficient stock.`,
          });
        }

        const unitPrice = toNumber(item.unit_price, Number(product.sale_price || 0));
        const totalPrice = unitPrice * quantity;

        subtotal += totalPrice;

        preparedItems.push({
          product,
          quantity,
          unitPrice,
          totalPrice,
        });
      }

      const deliveryFee = toNumber(body.delivery_fee, 0);
      const discountAmount = toNumber(body.discount_amount, 0);
      const totalAmount = Math.max(subtotal + deliveryFee - discountAmount, 0);
      const paymentMethod = body.payment_method || "cod";
      const orderNumber = `WA-${Date.now()}`;

      const orderResult = await client.query(
        `
        insert into orders (
          order_number,
          customer_id,
          channel,
          status,
          payment_status,
          customer_name,
          customer_phone,
          delivery_address,
          delivery_fee,
          subtotal,
          discount_amount,
          total_amount,
          cod_amount,
          cod_status,
          delivery_status,
          whatsapp_source,
          whatsapp_message,
          notes,
          created_by
        )
        values (
          $1, $2, 'whatsapp', 'pending', $3,
          $4, $5, $6, $7, $8, $9, $10,
          $11, $12, 'not_assigned',
          $13, $14, $15, $16
        )
        returning *
        `,
        [
          orderNumber,
          customerId,
          paymentMethod === "cod" ? "unpaid" : "paid",
          customerName,
          customerPhone,
          nullableText(body.delivery_address),
          deliveryFee,
          subtotal,
          discountAmount,
          totalAmount,
          paymentMethod === "cod" ? totalAmount : 0,
          paymentMethod === "cod" ? "pending" : "not_applicable",
          body.whatsapp_source || "manual",
          nullableText(body.whatsapp_message),
          nullableText(body.notes),
          req.user?.id || null,
        ]
      );

      const order = orderResult.rows[0];

      for (const item of preparedItems) {
        await client.query(
          `
          insert into order_items (
            order_id,
            product_id,
            product_name,
            sku,
            quantity,
            unit_price,
            total_price
          )
          values ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            order.id,
            item.product.id,
            item.product.name,
            item.product.sku || null,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
          ]
        );

        const previousStock = Number(item.product.stock_quantity || 0);
        const newStock = previousStock - item.quantity;

        await client.query(
          `
          update products
          set stock_quantity = $1,
              updated_at = now()
          where id = $2
          `,
          [newStock, item.product.id]
        );

        await client.query(
          `
          insert into inventory_movements (
            product_id,
            movement_type,
            quantity,
            previous_stock,
            new_stock,
            reason,
            reference_type,
            reference_id,
            created_by
          )
          values ($1, 'sale', $2, $3, $4, 'WhatsApp order created', 'order', $5, $6)
          `,
          [
            item.product.id,
            item.quantity,
            previousStock,
            newStock,
            order.id,
            req.user?.id || null,
          ]
        );
      }

      await client.query(
        `
        insert into payments (
          order_id,
          payment_method,
          amount,
          status
        )
        values ($1, $2, $3, $4)
        `,
        [
          order.id,
          paymentMethod,
          totalAmount,
          paymentMethod === "cod" ? "unpaid" : "paid",
        ]
      );

      await client.query(
        `
        update customers
        set
          total_orders = total_orders + 1,
          total_spent = total_spent + $1,
          last_order_at = now(),
          updated_at = now()
        where id = $2
        `,
        [totalAmount, customerId]
      );

      const templateResult = await client.query(
        `
        select message_body
        from whatsapp_message_templates
        where template_key = 'order_confirmation'
          and is_active = true
        limit 1
        `
      );

      const defaultMessage = templateResult.rows.length
        ? renderTemplate(templateResult.rows[0].message_body, {
            customer_name: customerName,
            order_number: order.order_number,
            total_amount: totalAmount,
          })
        : `Hello ${customerName}, your order ${order.order_number} has been created. Total amount is Rs ${totalAmount}.`;

      await client.query("commit");

      res.status(201).json({
        ok: true,
        message: "WhatsApp order created successfully.",
        data: {
          order: {
            ...order,
            order_number: buildOrderNumber(order),
          },
          whatsapp_message: defaultMessage,
        },
      });
    } catch (error) {
      await client.query("rollback");
      console.error("[createWhatsAppOrder]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to create WhatsApp order.",
      });
    } finally {
      client.release();
    }
  };
}

export function getWhatsAppTemplates(pool) {
  return async function (req, res) {
    try {
      const result = await pool.query(
        `
        select *
        from whatsapp_message_templates
        order by category asc, name asc
        `
      );

      res.json({
        ok: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("[getWhatsAppTemplates]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load WhatsApp templates.",
      });
    }
  };
}

export function createWhatsAppTemplate(pool) {
  return async function (req, res) {
    try {
      const body = req.body || {};
      const name = cleanText(body.name);
      const templateKey = cleanText(body.template_key)
        .toLowerCase()
        .replace(/\s+/g, "_");
      const messageBody = cleanText(body.message_body);

      if (!name || !templateKey || !messageBody) {
        return res.status(400).json({
          ok: false,
          message: "Name, key, and message body are required.",
        });
      }

      const result = await pool.query(
        `
        insert into whatsapp_message_templates (
          name,
          template_key,
          category,
          message_body,
          is_active
        )
        values ($1, $2, $3, $4, $5)
        returning *
        `,
        [
          name,
          templateKey,
          nullableText(body.category) || "order",
          messageBody,
          body.is_active !== false,
        ]
      );

      res.status(201).json({
        ok: true,
        message: "Template created successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[createWhatsAppTemplate]", error);

      if (error.code === "23505") {
        return res.status(409).json({
          ok: false,
          message: "Template key already exists.",
        });
      }

      res.status(500).json({
        ok: false,
        message: "Failed to create template.",
      });
    }
  };
}

export function updateWhatsAppTemplate(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};

      const name = cleanText(body.name);
      const templateKey = cleanText(body.template_key)
        .toLowerCase()
        .replace(/\s+/g, "_");
      const messageBody = cleanText(body.message_body);

      if (!name || !templateKey || !messageBody) {
        return res.status(400).json({
          ok: false,
          message: "Name, key, and message body are required.",
        });
      }

      const result = await pool.query(
        `
        update whatsapp_message_templates
        set
          name = $1,
          template_key = $2,
          category = $3,
          message_body = $4,
          is_active = $5,
          updated_at = now()
        where id = $6
        returning *
        `,
        [
          name,
          templateKey,
          nullableText(body.category) || "order",
          messageBody,
          body.is_active !== false,
          id,
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Template not found.",
        });
      }

      res.json({
        ok: true,
        message: "Template updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateWhatsAppTemplate]", error);

      if (error.code === "23505") {
        return res.status(409).json({
          ok: false,
          message: "Template key already exists.",
        });
      }

      res.status(500).json({
        ok: false,
        message: "Failed to update template.",
      });
    }
  };
}

export function deleteWhatsAppTemplate(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        update whatsapp_message_templates
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
          message: "Template not found.",
        });
      }

      res.json({
        ok: true,
        message: "Template disabled successfully.",
      });
    } catch (error) {
      console.error("[deleteWhatsAppTemplate]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to disable template.",
      });
    }
  };
}