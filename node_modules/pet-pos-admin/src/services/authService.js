import { api } from "./api";

export function login(payload) {
  return api.post("/auth/login", payload);
}

export function forgotPassword(payload) {
  return api.post("/auth/forgot-password", payload);
}

export function verifyOtp(payload) {
  return api.post("/auth/verify-otp", payload);
}

export function resetPassword(payload) {
  return api.post("/auth/reset-password", payload);
}

export function getMe() {
  return api.get("/auth/me");
}