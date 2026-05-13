import express from "express";
import {
  getPromotions,
  createPromotion,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  validatePromotion,
} from "./promotions.controller.js";

export default function promotionsRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/promotions", authMiddleware, getPromotions(pool));
  router.post("/promotions", authMiddleware, createPromotion(pool));

  router.post("/promotions/validate", authMiddleware, validatePromotion(pool));

  router.get("/promotions/:id", authMiddleware, getPromotionById(pool));
  router.patch("/promotions/:id", authMiddleware, updatePromotion(pool));
  router.delete("/promotions/:id", authMiddleware, deletePromotion(pool));

  return router;
}