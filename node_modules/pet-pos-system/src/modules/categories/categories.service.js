import { pool } from "../../config/db.js";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function listCategories({ search = "" }) {
  const params = [];
  const where = [];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    where.push(
      `(LOWER(name) LIKE $${params.length} OR LOWER(slug) LIKE $${params.length})`
    );
  }

  const result = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.slug,
      c.is_active,
      c.created_at,
      c.updated_at,
      COUNT(p.id)::int AS products_count
    FROM product_categories c
    LEFT JOIN products p ON p.category_id = c.id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY c.id
    ORDER BY c.created_at DESC
    `,
    params
  );

  return result.rows;
}

export async function getCategoryById(id) {
  const result = await pool.query(
    `
    SELECT id, name, slug, is_active, created_at, updated_at
    FROM product_categories
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function createCategory(payload) {
  const name = String(payload.name || "").trim();
  const slug = slugify(payload.slug || name);
  const isActive = payload.is_active !== false;

  if (!name) {
    return {
      ok: false,
      status: 400,
      message: "Category name is required.",
    };
  }

  if (!slug) {
    return {
      ok: false,
      status: 400,
      message: "Category slug is required.",
    };
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO product_categories (name, slug, is_active)
      VALUES ($1, $2, $3)
      RETURNING id, name, slug, is_active, created_at, updated_at
      `,
      [name, slug, isActive]
    );

    return {
      ok: true,
      status: 201,
      message: "Category created successfully.",
      data: result.rows[0],
    };
  } catch (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        status: 409,
        message: "Category slug already exists.",
      };
    }

    throw error;
  }
}

export async function updateCategory(id, payload) {
  const existing = await getCategoryById(id);

  if (!existing) {
    return {
      ok: false,
      status: 404,
      message: "Category not found.",
    };
  }

  const name = String(payload.name || existing.name).trim();
  const slug = slugify(payload.slug || existing.slug || name);
  const isActive =
    typeof payload.is_active === "boolean"
      ? payload.is_active
      : existing.is_active;

  try {
    const result = await pool.query(
      `
      UPDATE product_categories
      SET name = $1,
          slug = $2,
          is_active = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, slug, is_active, created_at, updated_at
      `,
      [name, slug, isActive, id]
    );

    return {
      ok: true,
      status: 200,
      message: "Category updated successfully.",
      data: result.rows[0],
    };
  } catch (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        status: 409,
        message: "Category slug already exists.",
      };
    }

    throw error;
  }
}

export async function deleteCategory(id) {
  const existing = await getCategoryById(id);

  if (!existing) {
    return {
      ok: false,
      status: 404,
      message: "Category not found.",
    };
  }

  await pool.query(
    `
    UPDATE products
    SET category_id = NULL,
        updated_at = NOW()
    WHERE category_id = $1
    `,
    [id]
  );

  await pool.query(`DELETE FROM product_categories WHERE id = $1`, [id]);

  return {
    ok: true,
    status: 200,
    message: "Category deleted successfully.",
  };
}