import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { dashboardSummaryController } from "./dashboard.controller.js";

const router = express.Router();

router.get("/summary", authMiddleware, asyncHandler(dashboardSummaryController));

export default router;