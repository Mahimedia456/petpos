import { apiJson } from "../lib/apiFetch";

function axiosLike(data) {
  return { data };
}

export async function login(payload) {
  const data = await apiJson("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return axiosLike(data);
}

export async function forgotPassword(payload) {
  const data = await apiJson("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return axiosLike(data);
}

export async function verifyOtp(payload) {
  const data = await apiJson("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return axiosLike(data);
}

export async function resetPassword(payload) {
  const data = await apiJson("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return axiosLike(data);
}

export async function me() {
  const data = await apiJson("/auth/me");
  return axiosLike(data);
}