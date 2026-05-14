import express from "express";
import {
  getActivityLogs,
  createActivityLog,
} from "./audit.controller.js";

export default function auditRoutes({ pool, authMiddleware }) {
  const router = express.Router();

  router.get("/activity-logs", authMiddleware, getActivityLogs(pool));
  router.post("/activity-logs", authMiddleware, createActivityLog(pool));

  return router;
}