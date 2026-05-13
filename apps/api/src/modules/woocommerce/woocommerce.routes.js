import express from "express";
import {
  getWooCommerceSettings,
  updateWooCommerceSettings,
  getWooCommerceStatus,
  testWooCommerceConnection,
  syncWooCommerceProducts,
  importWooCommerceOrders,
  pushProductStockToWooCommerce,
} from "./woocommerce.controller.js";

export default function woocommerceRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/woocommerce/settings", authMiddleware, getWooCommerceSettings(pool));
  router.patch(
    "/woocommerce/settings",
    authMiddleware,
    updateWooCommerceSettings(pool)
  );

  router.get("/woocommerce/status", authMiddleware, getWooCommerceStatus(pool));
  router.post(
    "/woocommerce/test-connection",
    authMiddleware,
    testWooCommerceConnection(pool)
  );

  router.post(
    "/woocommerce/sync-products",
    authMiddleware,
    syncWooCommerceProducts(pool)
  );

  router.post(
    "/woocommerce/import-orders",
    authMiddleware,
    importWooCommerceOrders(pool)
  );

  router.post(
    "/woocommerce/push-stock/:productId",
    authMiddleware,
    pushProductStockToWooCommerce(pool)
  );

  return router;
}