import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  forgotPasswordController,
  loginController,
  meController,
  resetPasswordController,
  verifyOtpController,
} from "./auth.controller.js";

const router = express.Router();

router.post("/login", asyncHandler(loginController));
router.get("/me", authMiddleware, asyncHandler(meController));

router.post("/forgot-password", asyncHandler(forgotPasswordController));
router.post("/verify-otp", asyncHandler(verifyOtpController));
router.post("/reset-password", asyncHandler(resetPasswordController));

export default router;