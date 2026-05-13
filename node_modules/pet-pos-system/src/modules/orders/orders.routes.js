import express from "express";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from "./orders.controller.js";

export default function ordersRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/orders", authMiddleware, getOrders(pool));
  router.get("/orders/:id", authMiddleware, getOrderById(pool));
  router.patch("/orders/:id/status", authMiddleware, updateOrderStatus(pool));
  router.patch(
    "/orders/:id/payment-status",
    authMiddleware,
    updatePaymentStatus(pool)
  );

  return router;
}