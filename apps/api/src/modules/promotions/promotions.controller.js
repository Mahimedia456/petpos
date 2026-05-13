const PROMOTION_TYPES = ["coupon", "automatic", "bogo"];
const DISCOUNT_TYPES = ["percentage", "fixed"];
const APPLIES_TO = ["cart", "product", "category"];

function cleanText(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function normalizeCode(value) {
  const cleaned = cleanText(value).toUpperCase().replace(/\s+/g, "");
  return cleaned || null;
}

function toNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toIntOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toDateOrNull(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function toBool(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function calculateDiscount({
  promotion,
  cartSubtotal,
  eligibleSubtotal,
}) {
  const baseAmount =
    promotion.applies_to === "cart" ? cartSubtotal : eligibleSubtotal;

  if (baseAmount <= 0) {
    return 0;
  }

  if (Number(promotion.min_order_amount || 0) > cartSubtotal) {
    return 0;
  }

  let discount = 0;

  if (promotion.discount_type === "percentage") {
    discount = (baseAmount * Number(promotion.discount_value || 0)) / 100;
  } else {
    discount = Number(promotion.discount_value || 0);
  }

  if (promotion.max_discount_amount !== null && promotion.max_discount_amount !== undefined) {
    discount = Math.min(discount, Number(promotion.max_discount_amount || 0));
  }

  discount = Math.min(discount, cartSubtotal);

  return Number(discount.toFixed(2));
}

async function getEligibleSubtotal(pool, promotion, items = []) {
  if (!items.length) return 0;

  if (promotion.applies_to === "cart") {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unit_price || item.sale_price || item.price || 0);
      return sum + qty * price;
    }, 0);
  }

  if (promotion.applies_to === "product") {
    return items
      .filter((item) => String(item.product_id) === String(promotion.product_id))
      .reduce((sum, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unit_price || item.sale_price || item.price || 0);
        return sum + qty * price;
      }, 0);
  }

  if (promotion.applies_to === "category") {
    const productIds = items.map((item) => item.product_id).filter(Boolean);

    if (!productIds.length) return 0;

    const result = await pool.query(
      `
      select id
      from products
      where id = any($1::uuid[])
        and category_id = $2
      `,
      [productIds, promotion.category_id]
    );

    const eligibleIds = new Set(result.rows.map((row) => String(row.id)));

    return items
      .filter((item) => eligibleIds.has(String(item.product_id)))
      .reduce((sum, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unit_price || item.sale_price || item.price || 0);
        return sum + qty * price;
      }, 0);
  }

  return 0;
}

export function getPromotions(pool) {
  return async function (req, res) {
    try {
      const search = cleanText(req.query.search);
      const active = req.query.active;
      const promotionType = cleanText(req.query.promotion_type);

      const params = [];
      const where = [];

      if (search) {
        params.push(`%${search}%`);
        where.push(`
          (
            p.name ilike $${params.length}
            or p.code ilike $${params.length}
            or p.description ilike $${params.length}
          )
        `);
      }

      if (active === "true" || active === "false") {
        params.push(active === "true");
        where.push(`p.is_active = $${params.length}`);
      }

      if (promotionType && PROMOTION_TYPES.includes(promotionType)) {
        params.push(promotionType);
        where.push(`p.promotion_type = $${params.length}`);
      }

      const whereSql = where.length ? `where ${where.join(" and ")}` : "";

      const result = await pool.query(
        `
        select
          p.*,
          pr.name as product_name,
          c.name as category_name
        from promotions p
        left join products pr on pr.id = p.product_id
        left join categories c on c.id = p.category_id
        ${whereSql}
        order by p.created_at desc
        limit 300
        `,
        params
      );

      const summaryResult = await pool.query(`
        select
          count(*)::int as total_promotions,
          count(*) filter (where is_active = true)::int as active_promotions,
          count(*) filter (
            where is_active = true
              and (start_date is null or start_date <= now())
              and (end_date is null or end_date >= now())
          )::int as currently_valid,
          coalesce(sum(used_count), 0)::int as total_uses
        from promotions
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          promotions: result.rows,
        },
      });
    } catch (error) {
      console.error("[getPromotions]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load promotions.",
      });
    }
  };
}

export function createPromotion(pool) {
  return async function (req, res) {
    try {
      const body = req.body || {};
      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Promotion name is required.",
        });
      }

      const promotionType = PROMOTION_TYPES.includes(body.promotion_type)
        ? body.promotion_type
        : "coupon";

      const discountType = DISCOUNT_TYPES.includes(body.discount_type)
        ? body.discount_type
        : "percentage";

      const appliesTo = APPLIES_TO.includes(body.applies_to)
        ? body.applies_to
        : "cart";

      const code = promotionType === "coupon" ? normalizeCode(body.code) : normalizeCode(body.code);

      if (promotionType === "coupon" && !code) {
        return res.status(400).json({
          ok: false,
          message: "Coupon code is required for coupon promotion.",
        });
      }

      if (appliesTo === "product" && !body.product_id) {
        return res.status(400).json({
          ok: false,
          message: "Product is required for product promotion.",
        });
      }

      if (appliesTo === "category" && !body.category_id) {
        return res.status(400).json({
          ok: false,
          message: "Category is required for category promotion.",
        });
      }

      const discountValue = toNumber(body.discount_value, 0);

      if (discountValue <= 0) {
        return res.status(400).json({
          ok: false,
          message: "Discount value must be greater than 0.",
        });
      }

      const result = await pool.query(
        `
        insert into promotions (
          name,
          code,
          description,
          promotion_type,
          discount_type,
          discount_value,
          min_order_amount,
          max_discount_amount,
          applies_to,
          product_id,
          category_id,
          usage_limit,
          per_customer_limit,
          start_date,
          end_date,
          is_active
        )
        values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16
        )
        returning *
        `,
        [
          name,
          code,
          nullableText(body.description),
          promotionType,
          discountType,
          discountValue,
          toNumber(body.min_order_amount, 0),
          body.max_discount_amount === "" || body.max_discount_amount === null
            ? null
            : toNumber(body.max_discount_amount, 0),
          appliesTo,
          appliesTo === "product" ? body.product_id : null,
          appliesTo === "category" ? body.category_id : null,
          toIntOrNull(body.usage_limit),
          toIntOrNull(body.per_customer_limit),
          toDateOrNull(body.start_date),
          toDateOrNull(body.end_date),
          toBool(body.is_active, true),
        ]
      );

      res.status(201).json({
        ok: true,
        message: "Promotion created successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[createPromotion]", error);

      if (error.code === "23505") {
        return res.status(409).json({
          ok: false,
          message: "Promotion code already exists.",
        });
      }

      res.status(500).json({
        ok: false,
        message: "Failed to create promotion.",
      });
    }
  };
}

export function getPromotionById(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const promotionResult = await pool.query(
        `
        select
          p.*,
          pr.name as product_name,
          c.name as category_name
        from promotions p
        left join products pr on pr.id = p.product_id
        left join categories c on c.id = p.category_id
        where p.id = $1
        limit 1
        `,
        [id]
      );

      if (!promotionResult.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Promotion not found.",
        });
      }

      const usagesResult = await pool.query(
        `
        select
          pu.*,
          o.order_number,
          o.customer_name,
          o.customer_phone
        from promotion_usages pu
        left join orders o on o.id = pu.order_id
        where pu.promotion_id = $1
        order by pu.created_at desc
        limit 100
        `,
        [id]
      );

      res.json({
        ok: true,
        data: {
          promotion: promotionResult.rows[0],
          usages: usagesResult.rows,
        },
      });
    } catch (error) {
      console.error("[getPromotionById]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load promotion.",
      });
    }
  };
}

export function updatePromotion(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const name = cleanText(body.name);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "Promotion name is required.",
        });
      }

      const promotionType = PROMOTION_TYPES.includes(body.promotion_type)
        ? body.promotion_type
        : "coupon";

      const discountType = DISCOUNT_TYPES.includes(body.discount_type)
        ? body.discount_type
        : "percentage";

      const appliesTo = APPLIES_TO.includes(body.applies_to)
        ? body.applies_to
        : "cart";

      const code = normalizeCode(body.code);

      if (promotionType === "coupon" && !code) {
        return res.status(400).json({
          ok: false,
          message: "Coupon code is required for coupon promotion.",
        });
      }

      if (appliesTo === "product" && !body.product_id) {
        return res.status(400).json({
          ok: false,
          message: "Product is required for product promotion.",
        });
      }

      if (appliesTo === "category" && !body.category_id) {
        return res.status(400).json({
          ok: false,
          message: "Category is required for category promotion.",
        });
      }

      const discountValue = toNumber(body.discount_value, 0);

      if (discountValue <= 0) {
        return res.status(400).json({
          ok: false,
          message: "Discount value must be greater than 0.",
        });
      }

      const result = await pool.query(
        `
        update promotions
        set
          name = $1,
          code = $2,
          description = $3,
          promotion_type = $4,
          discount_type = $5,
          discount_value = $6,
          min_order_amount = $7,
          max_discount_amount = $8,
          applies_to = $9,
          product_id = $10,
          category_id = $11,
          usage_limit = $12,
          per_customer_limit = $13,
          start_date = $14,
          end_date = $15,
          is_active = $16,
          updated_at = now()
        where id = $17
        returning *
        `,
        [
          name,
          code,
          nullableText(body.description),
          promotionType,
          discountType,
          discountValue,
          toNumber(body.min_order_amount, 0),
          body.max_discount_amount === "" || body.max_discount_amount === null
            ? null
            : toNumber(body.max_discount_amount, 0),
          appliesTo,
          appliesTo === "product" ? body.product_id : null,
          appliesTo === "category" ? body.category_id : null,
          toIntOrNull(body.usage_limit),
          toIntOrNull(body.per_customer_limit),
          toDateOrNull(body.start_date),
          toDateOrNull(body.end_date),
          toBool(body.is_active, true),
          id,
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "Promotion not found.",
        });
      }

      res.json({
        ok: true,
        message: "Promotion updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updatePromotion]", error);

      if (error.code === "23505") {
        return res.status(409).json({
          ok: false,
          message: "Promotion code already exists.",
        });
      }

      res.status(500).json({
        ok: false,
        message: "Failed to update promotion.",
      });
    }
  };
}

export function deletePromotion(pool) {
  return async function (req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `
        update promotions
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
          message: "Promotion not found.",
        });
      }

      res.json({
        ok: true,
        message: "Promotion disabled successfully.",
      });
    } catch (error) {
      console.error("[deletePromotion]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to disable promotion.",
      });
    }
  };
}

export function validatePromotion(pool) {
  return async function (req, res) {
    try {
      const body = req.body || {};
      const code = normalizeCode(body.code);
      const cartSubtotal = toNumber(body.cart_subtotal, 0);
      const items = Array.isArray(body.items) ? body.items : [];
      const customerId = body.customer_id || null;

      if (!code) {
        return res.status(400).json({
          ok: false,
          message: "Promotion code is required.",
        });
      }

      if (cartSubtotal <= 0) {
        return res.status(400).json({
          ok: false,
          message: "Cart subtotal must be greater than 0.",
        });
      }

      const promoResult = await pool.query(
        `
        select *
        from promotions
        where code = $1
          and is_active = true
        limit 1
        `,
        [code]
      );

      if (!promoResult.rows.length) {
        return res.status(404).json({
          ok: false,
          valid: false,
          message: "Invalid or inactive promotion code.",
        });
      }

      const promotion = promoResult.rows[0];

      const nowResult = await pool.query(`select now() as now`);
      const now = new Date(nowResult.rows[0].now);

      if (promotion.start_date && new Date(promotion.start_date) > now) {
        return res.status(400).json({
          ok: false,
          valid: false,
          message: "Promotion has not started yet.",
        });
      }

      if (promotion.end_date && new Date(promotion.end_date) < now) {
        return res.status(400).json({
          ok: false,
          valid: false,
          message: "Promotion has expired.",
        });
      }

      if (
        promotion.usage_limit !== null &&
        promotion.usage_limit !== undefined &&
        Number(promotion.used_count || 0) >= Number(promotion.usage_limit)
      ) {
        return res.status(400).json({
          ok: false,
          valid: false,
          message: "Promotion usage limit reached.",
        });
      }

      if (Number(promotion.min_order_amount || 0) > cartSubtotal) {
        return res.status(400).json({
          ok: false,
          valid: false,
          message: `Minimum order amount is Rs ${Number(
            promotion.min_order_amount || 0
          ).toLocaleString()}.`,
        });
      }

      if (promotion.per_customer_limit && customerId) {
        const customerUsageResult = await pool.query(
          `
          select count(*)::int as count
          from promotion_usages
          where promotion_id = $1
            and customer_id = $2
          `,
          [promotion.id, customerId]
        );

        if (
          Number(customerUsageResult.rows[0].count || 0) >=
          Number(promotion.per_customer_limit)
        ) {
          return res.status(400).json({
            ok: false,
            valid: false,
            message: "Customer usage limit reached.",
          });
        }
      }

      const eligibleSubtotal = await getEligibleSubtotal(pool, promotion, items);

      if (promotion.applies_to !== "cart" && eligibleSubtotal <= 0) {
        return res.status(400).json({
          ok: false,
          valid: false,
          message: `Promotion is not applicable to selected items.`,
        });
      }

      const discountAmount = calculateDiscount({
        promotion,
        cartSubtotal,
        eligibleSubtotal,
      });

      if (discountAmount <= 0) {
        return res.status(400).json({
          ok: false,
          valid: false,
          message: "Promotion discount is not applicable.",
        });
      }

      res.json({
        ok: true,
        valid: true,
        message: "Promotion applied successfully.",
        data: {
          promotion_id: promotion.id,
          code: promotion.code,
          name: promotion.name,
          promotion_type: promotion.promotion_type,
          discount_type: promotion.discount_type,
          discount_value: promotion.discount_value,
          applies_to: promotion.applies_to,
          eligible_subtotal: eligibleSubtotal,
          cart_subtotal: cartSubtotal,
          discount_amount: discountAmount,
          total_after_discount: Math.max(cartSubtotal - discountAmount, 0),
        },
      });
    } catch (error) {
      console.error("[validatePromotion]", error);
      res.status(500).json({
        ok: false,
        valid: false,
        message: "Failed to validate promotion.",
      });
    }
  };
}