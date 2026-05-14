import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPosOrderController,
  getPosCategoriesController,
  getPosProductsController,
  scanPosBarcodeController,
} from "./pos.controller.js";

const router = express.Router();

router.get(
  "/categories",
  authMiddleware,
  asyncHandler(getPosCategoriesController)
);

router.get(
  "/products",
  authMiddleware,
  asyncHandler(getPosProductsController)
);

router.get("/scan", authMiddleware, asyncHandler(scanPosBarcodeController));
router.post("/scan", authMiddleware, asyncHandler(scanPosBarcodeController));
router.post(
  "/checkout",
  authMiddleware,
  asyncHandler(createPosOrderController)
);

export default router;