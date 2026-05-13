import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createCategoryController,
  deleteCategoryController,
  getCategoryController,
  listCategoriesController,
  updateCategoryController,
} from "./categories.controller.js";

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(listCategoriesController));
router.get("/:id", authMiddleware, asyncHandler(getCategoryController));
router.post("/", authMiddleware, asyncHandler(createCategoryController));
router.put("/:id", authMiddleware, asyncHandler(updateCategoryController));
router.delete("/:id", authMiddleware, asyncHandler(deleteCategoryController));

export default router;