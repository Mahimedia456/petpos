import { pool } from "../../config/db.js";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function cleanOptional(value) {
  const finalValue = String(value || "").trim();
  return finalValue || null;
}

export async function listProducts({
  search = "",
  category_id = "",
  stock_filter = "",
}) {
  const params = [];
  const where = ["1=1"];

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

  if (stock_filter === "low") {
    where.push(`p.stock_qty <= p.low_stock_threshold`);
  }

  if (stock_filter === "out") {
    where.push(`p.stock_qty <= 0`);
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.woo_product_id,
      p.category_id,
      c.name AS category_name,
      p.name,
      p.slug,
      p.sku,
      p.barcode,
      p.image_url,
      p.purchase_price,
      p.selling_price,
      p.regular_price,
      p.sale_price,
      p.stock_qty,
      p.low_stock_threshold,
      p.expiry_date,
      p.woo_status,
      p.woo_permalink,
      p.is_active,
      p.created_at,
      p.updated_at
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.created_at DESC
    LIMIT 300
    `,
    params
  );

  return result.rows.map((row) => ({
    ...row,
    purchase_price: Number(row.purchase_price || 0),
    selling_price: Number(row.selling_price || 0),
    regular_price: Number(row.regular_price || 0),
    sale_price: Number(row.sale_price || 0),
    stock_qty: Number(row.stock_qty || 0),
    low_stock_threshold: Number(row.low_stock_threshold || 0),
  }));
}

export async function getProductById(id) {
  const result = await pool.query(
    `
    SELECT
      p.*,
      c.name AS category_name
    FROM products p
    LEFT JOIN product_categories c ON c.id = p.category_id
    WHERE p.id = $1
    LIMIT 1
    `,
    [id]
  );

  const product = result.rows[0];

  if (!product) return null;

  return {
    ...product,
    purchase_price: Number(product.purchase_price || 0),
    selling_price: Number(product.selling_price || 0),
    regular_price: Number(product.regular_price || 0),
    sale_price: Number(product.sale_price || 0),
    stock_qty: Number(product.stock_qty || 0),
    low_stock_threshold: Number(product.low_stock_threshold || 0),
  };
}

export async function createProduct(payload, user) {
  const name = String(payload.name || "").trim();

  if (!name) {
    return {
      ok: false,
      status: 400,
      message: "Product name is required.",
    };
  }

  const slug = slugify(payload.slug || name);

  const data = {
    category_id: cleanOptional(payload.category_id),
    name,
    slug,
    sku: cleanOptional(payload.sku),
    barcode: cleanOptional(payload.barcode),
    image_url: cleanOptional(payload.image_url),
    purchase_price: toNumber(payload.purchase_price),
    selling_price: toNumber(payload.selling_price),
    regular_price: toNumber(payload.regular_price || payload.selling_price),
    sale_price: toNumber(payload.sale_price),
    stock_qty: Number(payload.stock_qty || 0),
    low_stock_threshold: Number(payload.low_stock_threshold || 5),
    expiry_date: cleanOptional(payload.expiry_date),
    is_active: payload.is_active !== false,
  };

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO products (
        category_id,
        name,
        slug,
        sku,
        barcode,
        image_url,
        purchase_price,
        selling_price,
        regular_price,
        sale_price,
        stock_qty,
        low_stock_threshold,
        expiry_date,
        is_active
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14
      )
      RETURNING *
      `,
      [
        data.category_id,
        data.name,
        data.slug,
        data.sku,
        data.barcode,
        data.image_url,
        data.purchase_price,
        data.selling_price,
        data.regular_price,
        data.sale_price,
        data.stock_qty,
        data.low_stock_threshold,
        data.expiry_date,
        data.is_active,
      ]
    );

    const product = result.rows[0];

    if (data.stock_qty !== 0) {
      await client.query(
        `
        INSERT INTO inventory_movements (
          product_id,
          movement_type,
          qty,
          previous_qty,
          new_qty,
          reference_type,
          notes,
          created_by
        )
        VALUES ($1, 'initial_stock', $2, 0, $3, 'product_create', $4, $5)
        `,
        [
          product.id,
          data.stock_qty,
          data.stock_qty,
          `Initial stock for ${product.name}`,
          user?.id || null,
        ]
      );
    }

    await client.query("COMMIT");

    return {
      ok: true,
      status: 201,
      message: "Product created successfully.",
      data: product,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return {
        ok: false,
        status: 409,
        message: "SKU or barcode already exists.",
      };
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function updateProduct(id, payload) {
  const existing = await getProductById(id);

  if (!existing) {
    return {
      ok: false,
      status: 404,
      message: "Product not found.",
    };
  }

  const data = {
    category_id:
      payload.category_id === "" ? null : payload.category_id ?? existing.category_id,
    name: String(payload.name || existing.name).trim(),
    slug: slugify(payload.slug || existing.slug || payload.name || existing.name),
    sku: cleanOptional(payload.sku ?? existing.sku),
    barcode: cleanOptional(payload.barcode ?? existing.barcode),
    image_url: cleanOptional(payload.image_url ?? existing.image_url),
    purchase_price: toNumber(payload.purchase_price ?? existing.purchase_price),
    selling_price: toNumber(payload.selling_price ?? existing.selling_price),
    regular_price: toNumber(payload.regular_price ?? existing.regular_price),
    sale_price: toNumber(payload.sale_price ?? existing.sale_price),
    stock_qty: Number(payload.stock_qty ?? existing.stock_qty),
    low_stock_threshold: Number(
      payload.low_stock_threshold ?? existing.low_stock_threshold
    ),
    expiry_date:
      payload.expiry_date === "" ? null : payload.expiry_date ?? existing.expiry_date,
    is_active:
      typeof payload.is_active === "boolean"
        ? payload.is_active
        : existing.is_active,
  };

  try {
    const result = await pool.query(
      `
      UPDATE products
      SET category_id = $1,
          name = $2,
          slug = $3,
          sku = $4,
          barcode = $5,
          image_url = $6,
          purchase_price = $7,
          selling_price = $8,
          regular_price = $9,
          sale_price = $10,
          stock_qty = $11,
          low_stock_threshold = $12,
          expiry_date = $13,
          is_active = $14,
          updated_at = NOW()
      WHERE id = $15
      RETURNING *
      `,
      [
        data.category_id,
        data.name,
        data.slug,
        data.sku,
        data.barcode,
        data.image_url,
        data.purchase_price,
        data.selling_price,
        data.regular_price,
        data.sale_price,
        data.stock_qty,
        data.low_stock_threshold,
        data.expiry_date,
        data.is_active,
        id,
      ]
    );

    return {
      ok: true,
      status: 200,
      message: "Product updated successfully.",
      data: result.rows[0],
    };
  } catch (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        status: 409,
        message: "SKU or barcode already exists.",
      };
    }

    throw error;
  }
}

export async function deleteProduct(id) {
  const existing = await getProductById(id);

  if (!existing) {
    return {
      ok: false,
      status: 404,
      message: "Product not found.",
    };
  }

  await pool.query(
    `
    UPDATE products
    SET is_active = FALSE,
        updated_at = NOW()
    WHERE id = $1
    `,
    [id]
  );

  return {
    ok: true,
    status: 200,
    message: "Product disabled successfully.",
  };
}