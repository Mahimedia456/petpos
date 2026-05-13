import express from "express";
import { getReportsSummary } from "./reports.controller.js";

export default function reportsRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/reports/summary", authMiddleware, getReportsSummary(pool));

  return router;
}