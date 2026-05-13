import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createProductController,
  deleteProductController,
  getProductController,
  listProductsController,
  updateProductController,
} from "./products.controller.js";

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(listProductsController));
router.get("/:id", authMiddleware, asyncHandler(getProductController));
router.post("/", authMiddleware, asyncHandler(createProductController));
router.put("/:id", authMiddleware, asyncHandler(updateProductController));
router.delete("/:id", authMiddleware, asyncHandler(deleteProductController));

export default router;