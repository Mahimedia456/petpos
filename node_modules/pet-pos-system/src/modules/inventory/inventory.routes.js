import express from "express";
import {
  getInventoryOverview,
  getLowStockProducts,
  getExpiryTrackingProducts,
  getInventoryMovements,
  adjustProductStock,
} from "./inventory.controller.js";

export default function inventoryRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/inventory/overview", authMiddleware, getInventoryOverview(pool));
  router.get("/inventory/low-stock", authMiddleware, getLowStockProducts(pool));
  router.get(
    "/inventory/expiry-tracking",
    authMiddleware,
    getExpiryTrackingProducts(pool)
  );
  router.get("/inventory/movements", authMiddleware, getInventoryMovements(pool));
  router.post("/inventory/adjust-stock", authMiddleware, adjustProductStock(pool));

  /**
   * Route aliases, frontend mein agar old names use hon to bhi work karega.
   */
  router.get("/inventory/summary", authMiddleware, getInventoryOverview(pool));
  router.get("/inventory/expiry", authMiddleware, getExpiryTrackingProducts(pool));
  router.post("/inventory/adjust", authMiddleware, adjustProductStock(pool));

  return router;
}