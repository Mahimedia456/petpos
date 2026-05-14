import express from "express";
import {
  getWhatsAppOrders,
  createWhatsAppOrder,
  getWhatsAppTemplates,
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
} from "./whatsapp.controller.js";

export default function whatsappRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/whatsapp/orders", authMiddleware, getWhatsAppOrders(pool));
  router.post("/whatsapp/orders", authMiddleware, createWhatsAppOrder(pool));

  router.get("/whatsapp/templates", authMiddleware, getWhatsAppTemplates(pool));
  router.post("/whatsapp/templates", authMiddleware, createWhatsAppTemplate(pool));
  router.patch(
    "/whatsapp/templates/:id",
    authMiddleware,
    updateWhatsAppTemplate(pool)
  );
  router.delete(
    "/whatsapp/templates/:id",
    authMiddleware,
    deleteWhatsAppTemplate(pool)
  );

  return router;
}