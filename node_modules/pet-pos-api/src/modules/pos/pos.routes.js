import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createPosOrderController,
  getPosCategoriesController,
  getPosProductsController,
} from "./pos.controller.js";

const router = express.Router();

router.get("/categories", authMiddleware, asyncHandler(getPosCategoriesController));
router.get("/products", authMiddleware, asyncHandler(getPosProductsController));
router.post("/checkout", authMiddleware, asyncHandler(createPosOrderController));

export default router;