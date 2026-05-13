import { pool } from "../../config/db.js";
import { generateOrderNo } from "../../utils/generateOrderNo.js";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.trunc(n);
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function calculatePromotionDiscount({ promotion, cartSubtotal, eligibleSubtotal }) {
  const baseAmount =
    promotion.applies_to === "cart" ? cartSubtotal : eligibleSubtotal;

  if (baseAmount <= 0) return 0;

  if (toNumber(promotion.min_order_amount) > cartSubtotal) {
    return 0;
  }

  let discount = 0;

  if (promotion.discount_type === "percentage") {
    discount = (baseAmount * toNumber(promotion.discount_value)) / 100;
  } else {
    discount = toNumber(promotion.discount_value);
  }

  if (
    promotion.max_discount_amount !== null &&
    promotion.max_discount_amount !== undefined
  ) {
    discount = Math.min(discount, toNumber(promotion.max_discount_amount));
  }

  discount = Math.min(discount, cartSubtotal);

  return Number(discount.toFixed(2));
}

async function validatePromotionForOrder(client, payload, normalizedItems, subtotal) {
  const promotionId = payload.promotion_id || null;
  const promotionCode = normalizeCode(payload.promotion_code || payload.code);

  if (!promotionId && !promotionCode) {
    return {
      promotion: null,
      discountAmount: 0,
    };
  }

  const promoResult = await client.query(
    `
    SELECT *
    FROM promotions
    WHERE is_active = TRUE
      AND (
        ($1::uuid IS NOT NULL AND id = $1::uuid)
        OR
        ($2::text IS NOT NULL AND code = $2::text)
      )
    LIMIT 1
    `,
    [promotionId, promotionCode || null]
  );

  if (!promoResult.rows.length) {
    throw new Error("Invalid or inactive promotion.");
  }

  const promotion = promoResult.rows[0];

  const nowResult = await client.query(`SELECT NOW() AS now`);
  const now = new Date(nowResult.rows[0].now);

  if (promotion.start_date && new Date(promotion.start_date) > now) {
    throw new Error("Promotion has not started yet.");
  }

  if (promotion.end_date && new Date(promotion.end_date) < now) {
    throw new Error("Promotion has expired.");
  }

  if (
    promotion.usage_limit !== null &&
    promotion.usage_limit !== undefined &&
    toNumber(promotion.used_count) >= toNumber(promotion.usage_limit)
  ) {
    throw new Error("Promotion usage limit reached.");
  }

  if (toNumber(promotion.min_order_amount) > subtotal) {
    throw new Error(
      `Minimum order amount is Rs ${toNumber(
        promotion.min_order_amount
      ).toLocaleString()}.`
    );
  }

  let eligibleSubtotal = subtotal;

  if (promotion.applies_to === "product") {
    eligibleSubtotal = normalizedItems
      .filter((item) => String(item.product_id) === String(promotion.product_id))
      .reduce((sum, item) => sum + item.line_total, 0);
  }

  if (promotion.applies_to === "category") {
    eligibleSubtotal = normalizedItems
      .filter((item) => String(item.category_id) === String(promotion.category_id))
      .reduce((sum, item) => sum + item.line_total, 0);
  }

  if (promotion.applies_to !== "cart" && eligibleSubtotal <= 0) {
    throw new Error("Promotion is not applicable to selected items.");
  }

  const calculatedDiscount = calculatePromotionDiscount({
    promotion,
    cartSubtotal: subtotal,
    eligibleSubtotal,
  });

  const frontendDiscount = toNumber(payload.promotion_discount, 0);

  const discountAmount =
    frontendDiscount > 0
      ? Math.min(frontendDiscount, calculatedDiscount || frontendDiscount)
      : calculatedDiscount;

  if (discountAmount <= 0) {
    throw new Error("Promotion discount is not applicable.");
  }

  return {
    promotion,
    discountAmount,
  };
}

export async function listPosCategories() {
  const result = await pool.query(
    `
    SELECT id, name, slug
    FROM product_categories
    WHERE is_active = TRUE
    ORDER BY name ASC
    `
  );

  return result.rows;
}

export async function listPosProducts({ search = "", category_id = "" }) {
  const params = [];
  const where = ["p.is_active = TRUE"];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(`
      (
        LOWER(p.name) LIKE $${params.length}
        OR LOWER(COALESCE(p.sku, '')) LIKE $${params.length}
        OR LOWER(COALESCE(p.barcode, '')) LIKE $${params.length}
      )
    `);
  }

  if (category_id) {
    params.push(category_id);
    where.push(`p.category_id = $${params.length}`);
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.name,
      p.sku,
      p.barcode,
      p.image_url,
      p.purchase_price,
      p.selling_price,
      p.regular_price,
      p.sale_price,
      p.stock_qty,
      p.low_stock_threshold,
      p.category_id,
      c.name AS category_name
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.name ASC
    LIMIT 100
    `,
    params
  );

  return result.rows.map((product) => ({
    ...product,
    purchase_price: toNumber(product.purchase_price),
    selling_price: toNumber(product.selling_price),
    regular_price: toNumber(product.regular_price),
    sale_price: toNumber(product.sale_price),
    stock_qty: toNumber(product.stock_qty),
    stock_quantity: toNumber(product.stock_qty),
    low_stock_threshold: toNumber(product.low_stock_threshold),
  }));
}

export async function createPosOrder(payload, user) {
  const client = await pool.connect();

  try {
    const {
      customer_name = "Walk-in Customer",
      customer_phone = "",
      source = "walk_in",
      channel = "walk_in",
      payment_method = "cash",
      payment_reference = "",
      discount_total = 0,
      discount_amount = 0,
      tax_total = 0,
      delivery_fee = 0,
      notes = "",
      items = [],
    } = payload || {};

    if (!Array.isArray(items) || items.length === 0) {
      return {
        ok: false,
        status: 400,
        message: "Cart is empty.",
      };
    }

    await client.query("BEGIN");

    const productIds = items.map((item) => item.product_id).filter(Boolean);

    if (!productIds.length) {
      throw new Error("Invalid cart products.");
    }

    const productsResult = await client.query(
      `
      SELECT
        id,
        name,
        sku,
        category_id,
        selling_price,
        purchase_price,
        stock_qty
      FROM products
      WHERE id = ANY($1::uuid[])
        AND is_active = TRUE
      FOR UPDATE
      `,
      [productIds]
    );

    const productsMap = new Map(
      productsResult.rows.map((product) => [String(product.id), product])
    );

    let subtotal = 0;
    const normalizedItems = [];

    for (const item of items) {
      const product = productsMap.get(String(item.product_id));

      if (!product) {
        throw new Error("Product not found or inactive.");
      }

      const qty = toQty(item.qty || item.quantity);

      if (!qty || qty <= 0) {
        throw new Error(`Invalid quantity for ${product.name}.`);
      }

      if (toNumber(product.stock_qty) < qty) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available stock: ${product.stock_qty}`
        );
      }

      const unitPrice = toNumber(item.unit_price, toNumber(product.selling_price));
      const lineDiscount = toNumber(item.discount);
      const lineTotal = Math.max(unitPrice * qty - lineDiscount, 0);

      subtotal += lineTotal;

      normalizedItems.push({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        category_id: product.category_id,
        qty,
        quantity: qty,
        unit_price: unitPrice,
        purchase_price: toNumber(product.purchase_price),
        discount: lineDiscount,
        line_total: lineTotal,
        total_price: lineTotal,
        previous_qty: toNumber(product.stock_qty),
        new_qty: toNumber(product.stock_qty) - qty,
      });
    }

    const promotionValidation = await validatePromotionForOrder(
      client,
      payload,
      normalizedItems,
      subtotal
    );

    const promotion = promotionValidation.promotion;
    const promotionDiscount = promotionValidation.discountAmount;

    const manualDiscount = Math.max(
      toNumber(discount_total || discount_amount) - promotionDiscount,
      0
    );

    const finalDiscount = manualDiscount + promotionDiscount;
    const finalTax = toNumber(tax_total);
    const finalDeliveryFee = toNumber(delivery_fee);
    const grandTotal = Math.max(
      subtotal - finalDiscount + finalTax + finalDeliveryFee,
      0
    );

    const orderNo = generateOrderNo("POS");

    let customerId = null;

    if (customer_phone) {
      const customerResult = await client.query(
        `
        INSERT INTO customers (name, phone)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING id
        `,
        [customer_name || "POS Customer", customer_phone]
      );

      if (customerResult.rows[0]?.id) {
        customerId = customerResult.rows[0].id;
      } else {
        const existingCustomer = await client.query(
          `
          SELECT id
          FROM customers
          WHERE phone = $1
          LIMIT 1
          `,
          [customer_phone]
        );

        customerId = existingCustomer.rows[0]?.id || null;
      }
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        order_no,
        customer_id,
        source,
        status,
        payment_status,
        subtotal,
        discount_total,
        tax_total,
        delivery_fee,
        grand_total,
        customer_name,
        customer_phone,
        notes,
        promotion_id,
        promotion_code,
        promotion_discount,
        created_by
      )
      VALUES (
        $1, $2, $3, 'completed', 'paid',
        $4, $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14,
        $15
      )
      RETURNING *
      `,
      [
        orderNo,
        customerId,
        source || channel || "walk_in",
        subtotal,
        finalDiscount,
        finalTax,
        finalDeliveryFee,
        grandTotal,
        customer_name,
        customer_phone,
        notes,
        promotion?.id || null,
        promotion?.code || null,
        promotionDiscount,
        user?.id || null,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of normalizedItems) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          sku,
          qty,
          unit_price,
          purchase_price,
          discount,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          order.id,
          item.product_id,
          item.product_name,
          item.sku,
          item.qty,
          item.unit_price,
          item.purchase_price,
          item.discount,
          item.line_total,
        ]
      );

      await client.query(
        `
        UPDATE products
        SET stock_qty = stock_qty - $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [item.qty, item.product_id]
      );

      await client.query(
        `
        INSERT INTO inventory_movements (
          product_id,
          movement_type,
          qty,
          previous_qty,
          new_qty,
          reference_type,
          reference_id,
          notes,
          created_by
        )
        VALUES ($1, 'sale', $2, $3, $4, 'order', $5, $6, $7)
        `,
        [
          item.product_id,
          -Math.abs(item.qty),
          item.previous_qty,
          item.new_qty,
          order.id,
          `POS sale ${order.order_no}`,
          user?.id || null,
        ]
      );
    }

    await client.query(
      `
      INSERT INTO payments (
        order_id,
        method,
        amount,
        reference_no,
        status
      )
      VALUES ($1, $2, $3, $4, 'paid')
      `,
      [order.id, payment_method, grandTotal, payment_reference]
    );

    if (promotion?.id && promotionDiscount > 0) {
      await client.query(
        `
        INSERT INTO promotion_usages (
          promotion_id,
          order_id,
          customer_id,
          code,
          discount_amount,
          order_total
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          promotion.id,
          order.id,
          customerId,
          promotion.code,
          promotionDiscount,
          grandTotal,
        ]
      );

      await client.query(
        `
        UPDATE promotions
        SET used_count = used_count + 1,
            updated_at = NOW()
        WHERE id = $1
        `,
        [promotion.id]
      );
    }

    if (customerId) {
      await client.query(
        `
        UPDATE customers
        SET
          total_orders = COALESCE(total_orders, 0) + 1,
          total_spent = COALESCE(total_spent, 0) + $1,
          last_order_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
        `,
        [grandTotal, customerId]
      );
    }

    await client.query("COMMIT");

    return {
      ok: true,
      status: 201,
      message: "POS order completed successfully.",
      data: {
        order: {
          ...order,
          order_number: order.order_no,
          total_amount: Number(order.grand_total || 0),
          subtotal: Number(order.subtotal || 0),
          discount_total: Number(order.discount_total || 0),
          discount_amount: Number(order.discount_total || 0),
          promotion_discount: Number(order.promotion_discount || 0),
          tax_total: Number(order.tax_total || 0),
          delivery_fee: Number(order.delivery_fee || 0),
          grand_total: Number(order.grand_total || 0),
        },
        items: normalizedItems,
        payment: {
          method: payment_method,
          amount: grandTotal,
          reference_no: payment_reference,
        },
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");

    return {
      ok: false,
      status: 400,
      message: error.message || "Failed to create POS order.",
    };
  } finally {
    client.release();
  }
}