import express from "express";
import {
  getRiders,
  createRider,
  getRiderById,
  updateRider,
  deleteRider,
  getDeliveryOrders,
  getDeliveryOrderById,
  assignDeliveryOrder,
  updateDeliveryStatus,
  updateCodStatus,
} from "./delivery.controller.js";

export default function deliveryRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/delivery/riders", authMiddleware, getRiders(pool));
  router.post("/delivery/riders", authMiddleware, createRider(pool));
  router.get("/delivery/riders/:id", authMiddleware, getRiderById(pool));
  router.patch("/delivery/riders/:id", authMiddleware, updateRider(pool));
  router.delete("/delivery/riders/:id", authMiddleware, deleteRider(pool));

  router.get("/delivery/orders", authMiddleware, getDeliveryOrders(pool));
  router.get(
    "/delivery/orders/:orderId",
    authMiddleware,
    getDeliveryOrderById(pool)
  );
  router.patch(
    "/delivery/orders/:orderId/assign",
    authMiddleware,
    assignDeliveryOrder(pool)
  );
  router.patch(
    "/delivery/orders/:orderId/status",
    authMiddleware,
    updateDeliveryStatus(pool)
  );
  router.patch(
    "/delivery/orders/:orderId/cod",
    authMiddleware,
    updateCodStatus(pool)
  );

  return router;
}