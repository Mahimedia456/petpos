function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeMovementType(value) {
  const type = String(value || "").trim();

  const aliases = {
    in: "stock_in",
    out: "stock_out",
    sale: "sale",
    stock_in: "stock_in",
    stock_out: "stock_out",
    adjustment: "adjustment",
    return: "return",
    expired: "expired",
    damage: "damage",
  };

  return aliases[type] || type || "adjustment";
}

function movementQtyForInsert(movementType, qty) {
  const absQty = Math.abs(toInt(qty));

  if (
    movementType === "stock_out" ||
    movementType === "expired" ||
    movementType === "damage" ||
    movementType === "sale"
  ) {
    return -absQty;
  }

  if (movementType === "adjustment") {
    return toInt(qty);
  }

  return absQty;
}

export function getInventoryOverview(pool) {
  return async function (req, res) {
    try {
      const summaryQuery = `
        select
          count(*)::int as total_products,
          coalesce(sum(stock_qty), 0)::int as total_stock_units,
          count(*) filter (
            where coalesce(stock_qty, 0) <= coalesce(low_stock_threshold, 0)
          )::int as low_stock_count,
          count(*) filter (
            where expiry_date is not null
              and expiry_date >= current_date
              and expiry_date <= current_date + interval '30 days'
          )::int as expiring_soon_count,
          count(*) filter (
            where expiry_date is not null
              and expiry_date < current_date
          )::int as expired_count,
          coalesce(sum(coalesce(stock_qty, 0) * coalesce(purchase_price, 0)), 0)::numeric as inventory_cost_value,
          coalesce(sum(coalesce(stock_qty, 0) * coalesce(selling_price, sale_price, 0)), 0)::numeric as inventory_sale_value
        from products
        where coalesce(is_active, true) = true
      `;

      const recentMovementsQuery = `
        select
          im.id,
          im.product_id,
          p.name as product_name,
          p.sku,
          p.barcode,
          im.movement_type,
          im.qty,
          im.qty as quantity,
          im.previous_qty,
          im.previous_qty as previous_stock,
          im.new_qty,
          im.new_qty as new_stock,
          im.notes,
          im.notes as reason,
          im.reference_type,
          im.reference_id,
          im.created_at
        from inventory_movements im
        join products p on p.id = im.product_id
        order by im.created_at desc
        limit 10
      `;

      const [summaryResult, movementsResult] = await Promise.all([
        pool.query(summaryQuery),
        pool.query(recentMovementsQuery),
      ]);

      const summary = summaryResult.rows[0] || {};

      res.json({
        ok: true,
        data: {
          summary: {
            total_products: toInt(summary.total_products),
            total_stock_units: toInt(summary.total_stock_units),
            low_stock_count: toInt(summary.low_stock_count),
            expiring_soon_count: toInt(summary.expiring_soon_count),
            expired_count: toInt(summary.expired_count),
            inventory_cost_value: toNumber(summary.inventory_cost_value),
            inventory_sale_value: toNumber(summary.inventory_sale_value),
          },
          recent_movements: movementsResult.rows,
        },
      });
    } catch (error) {
      console.error("[getInventoryOverview]", error);
      res.status(500).json({
        ok: false,
        message: error.message || "Failed to load inventory overview.",
      });
    }
  };
}

export function getLowStockProducts(pool) {
  return async function (req, res) {
    try {
      const result = await pool.query(`
        select
          p.id,
          p.name,
          p.sku,
          p.barcode,
          p.stock_qty,
          p.stock_qty as stock_quantity,
          p.low_stock_threshold,
          p.selling_price,
          p.selling_price as sale_price,
          p.expiry_date,
          p.category_id,
          c.name as category_name
        from products p
        left join product_categories c on c.id = p.category_id
        where coalesce(p.is_active, true) = true
          and coalesce(p.stock_qty, 0) <= coalesce(p.low_stock_threshold, 0)
        order by p.stock_qty asc, p.name asc
      `);

      res.json({
        ok: true,
        data: result.rows.map((row) => ({
          ...row,
          stock_qty: toInt(row.stock_qty),
          stock_quantity: toInt(row.stock_qty),
          low_stock_threshold: toInt(row.low_stock_threshold),
          selling_price: toNumber(row.selling_price),
          sale_price: toNumber(row.selling_price),
        })),
      });
    } catch (error) {
      console.error("[getLowStockProducts]", error);
      res.status(500).json({
        ok: false,
        message: error.message || "Failed to load low stock products.",
      });
    }
  };
}

export function getExpiryTrackingProducts(pool) {
  return async function (req, res) {
    try {
      const days = toInt(req.query.days, 30);

      const result = await pool.query(
        `
        select
          p.id,
          p.name,
          p.sku,
          p.barcode,
          p.stock_qty,
          p.stock_qty as stock_quantity,
          p.low_stock_threshold,
          p.selling_price,
          p.selling_price as sale_price,
          p.expiry_date,
          p.category_id,
          c.name as category_name,
          case
            when p.expiry_date < current_date then 'expired'
            when p.expiry_date <= current_date + ($1::int * interval '1 day') then 'expiring_soon'
            else 'safe'
          end as expiry_status
        from products p
        left join product_categories c on c.id = p.category_id
        where coalesce(p.is_active, true) = true
          and p.expiry_date is not null
        order by p.expiry_date asc, p.name asc
        `,
        [days]
      );

      res.json({
        ok: true,
        data: result.rows.map((row) => ({
          ...row,
          stock_qty: toInt(row.stock_qty),
          stock_quantity: toInt(row.stock_qty),
          low_stock_threshold: toInt(row.low_stock_threshold),
          selling_price: toNumber(row.selling_price),
          sale_price: toNumber(row.selling_price),
        })),
      });
    } catch (error) {
      console.error("[getExpiryTrackingProducts]", error);
      res.status(500).json({
        ok: false,
        message: error.message || "Failed to load expiry tracking products.",
      });
    }
  };
}

export function getInventoryMovements(pool) {
  return async function (req, res) {
    try {
      const productId = req.query.product_id || null;
      const movementType = req.query.movement_type || null;

      const params = [];
      const where = [];

      if (productId) {
        params.push(productId);
        where.push(`im.product_id = $${params.length}`);
      }

      if (movementType) {
        params.push(movementType);
        where.push(`im.movement_type = $${params.length}`);
      }

      const whereSql = where.length ? `where ${where.join(" and ")}` : "";

      const result = await pool.query(
        `
        select
          im.id,
          im.product_id,
          p.name as product_name,
          p.sku,
          p.barcode,
          im.movement_type,
          im.qty,
          im.qty as quantity,
          im.previous_qty,
          im.previous_qty as previous_stock,
          im.new_qty,
          im.new_qty as new_stock,
          im.notes,
          im.notes as reason,
          im.reference_type,
          im.reference_id,
          im.created_at
        from inventory_movements im
        join products p on p.id = im.product_id
        ${whereSql}
        order by im.created_at desc
        limit 200
        `,
        params
      );

      res.json({
        ok: true,
        data: result.rows.map((row) => ({
          ...row,
          qty: toInt(row.qty),
          quantity: toInt(row.qty),
          previous_qty: toInt(row.previous_qty),
          previous_stock: toInt(row.previous_qty),
          new_qty: toInt(row.new_qty),
          new_stock: toInt(row.new_qty),
        })),
      });
    } catch (error) {
      console.error("[getInventoryMovements]", error);
      res.status(500).json({
        ok: false,
        message: error.message || "Failed to load inventory movements.",
      });
    }
  };
}

export function adjustProductStock(pool) {
  return async function (req, res) {
    const client = await pool.connect();

    try {
      const {
        product_id,
        movement_type = "adjustment",
        quantity,
        qty: qtyInput,
        reason = "",
        notes = "",
      } = req.body || {};

      if (!product_id) {
        return res.status(400).json({
          ok: false,
          message: "Product is required.",
        });
      }

      const qty = toInt(quantity ?? qtyInput);

      if (!qty || qty === 0) {
        return res.status(400).json({
          ok: false,
          message: "Quantity must be greater than 0.",
        });
      }

      const normalizedType = normalizeMovementType(movement_type);

      const allowedTypes = [
        "stock_in",
        "stock_out",
        "adjustment",
        "return",
        "expired",
        "damage",
        "sale",
      ];

      if (!allowedTypes.includes(normalizedType)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid movement type.",
        });
      }

      await client.query("begin");

      const productResult = await client.query(
        `
        select id, name, stock_qty
        from products
        where id = $1
        for update
        `,
        [product_id]
      );

      if (!productResult.rows.length) {
        await client.query("rollback");
        return res.status(404).json({
          ok: false,
          message: "Product not found.",
        });
      }

      const product = productResult.rows[0];
      const previousQty = toInt(product.stock_qty);

      let newQty = previousQty;

      if (normalizedType === "stock_in" || normalizedType === "return") {
        newQty = previousQty + Math.abs(qty);
      } else if (
        normalizedType === "stock_out" ||
        normalizedType === "expired" ||
        normalizedType === "damage" ||
        normalizedType === "sale"
      ) {
        newQty = previousQty - Math.abs(qty);
      } else if (normalizedType === "adjustment") {
        newQty = previousQty + qty;
      }

      if (newQty < 0) {
        await client.query("rollback");
        return res.status(400).json({
          ok: false,
          message: "Stock cannot go below 0.",
        });
      }

      await client.query(
        `
        update products
        set stock_qty = $1,
            updated_at = now()
        where id = $2
        `,
        [newQty, product_id]
      );

      const movementQty = movementQtyForInsert(normalizedType, qty);

      const movementResult = await client.query(
        `
        insert into inventory_movements (
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
        values ($1, $2, $3, $4, $5, 'manual', null, $6, $7)
        returning *
        `,
        [
          product_id,
          normalizedType,
          movementQty,
          previousQty,
          newQty,
          reason || notes || "Manual stock adjustment",
          req.user?.id || null,
        ]
      );

      await client.query("commit");

      res.json({
        ok: true,
        message: "Stock adjusted successfully.",
        data: {
          product_id,
          previous_qty: previousQty,
          previous_stock: previousQty,
          new_qty: newQty,
          new_stock: newQty,
          movement: {
            ...movementResult.rows[0],
            quantity: movementResult.rows[0].qty,
            previous_stock: movementResult.rows[0].previous_qty,
            new_stock: movementResult.rows[0].new_qty,
            reason: movementResult.rows[0].notes,
          },
        },
      });
    } catch (error) {
      await client.query("rollback");
      console.error("[adjustProductStock]", error);
      res.status(500).json({
        ok: false,
        message: error.message || "Failed to adjust stock.",
      });
    } finally {
      client.release();
    }
  };
}