import { pool } from "../../config/db.js";

export async function dashboardSummaryController(req, res) {
  const [products, lowStock, orders, todaySales, pendingOrders] =
    await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int AS count FROM products WHERE is_active = TRUE"
      ),
      pool.query(
        "SELECT COUNT(*)::int AS count FROM products WHERE stock_qty <= low_stock_threshold"
      ),
      pool.query("SELECT COUNT(*)::int AS count FROM orders"),
      pool.query(`
        SELECT COALESCE(SUM(grand_total), 0)::numeric AS total
        FROM orders
        WHERE DATE(created_at) = CURRENT_DATE
          AND status != 'cancelled'
      `),
      pool.query(
        "SELECT COUNT(*)::int AS count FROM orders WHERE status IN ('pending', 'processing')"
      ),
    ]);

  return res.json({
    ok: true,
    data: {
      totalProducts: products.rows[0].count,
      lowStockProducts: lowStock.rows[0].count,
      totalOrders: orders.rows[0].count,
      todaySales: Number(todaySales.rows[0].total || 0),
      pendingOrders: pendingOrders.rows[0].count,
    },
  });
}