import express from "express";
import {
  getStoreSettings,
  updateStoreSettings,
} from "./settings.controller.js";

export default function settingsRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/settings/store", authMiddleware, getStoreSettings(pool));
  router.patch("/settings/store", authMiddleware, updateStoreSettings(pool));

  return router;
}