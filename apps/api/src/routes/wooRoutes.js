import express from "express";
import { pool } from "../config/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/settings", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, store_url, consumer_key, consumer_secret, is_active, created_at, updated_at
       FROM woo_settings
       ORDER BY created_at DESC
       LIMIT 1`
    );

    return res.json({
      ok: true,
      data: result.rows[0] || null,
    });
  } catch (error) {
    console.error("Woo settings get error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to load WooCommerce settings.",
    });
  }
});

router.post("/settings", authMiddleware, async (req, res) => {
  try {
    const { store_url, consumer_key, consumer_secret } = req.body || {};

    if (!store_url || !consumer_key || !consumer_secret) {
      return res.status(400).json({
        ok: false,
        message: "Store URL, consumer key, and consumer secret are required.",
      });
    }

    await pool.query(`UPDATE woo_settings SET is_active = FALSE`);

    const result = await pool.query(
      `INSERT INTO woo_settings (store_url, consumer_key, consumer_secret, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, store_url, consumer_key, consumer_secret, is_active`,
      [store_url, consumer_key, consumer_secret]
    );

    return res.json({
      ok: true,
      message: "WooCommerce settings saved.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Woo settings save error:", error);
    return res.status(500).json({
      ok: false,
      message: "Failed to save WooCommerce settings.",
    });
  }
});

export default router;