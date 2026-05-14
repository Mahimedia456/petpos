import axios from "axios";
import { API_BASE, getAuthToken } from "../lib/apiFetch";

function authHeaders() {
  const token = getAuthToken();

  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

function handleAuthError(error) {
  if (error?.response?.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_user");

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  throw error;
}

export async function getPosCategories() {
  try {
    return await axios.get(`${API_BASE}/pos/categories`, authHeaders());
  } catch (error) {
    handleAuthError(error);
  }
}

export async function getPosProducts(params = {}) {
  try {
    return await axios.get(`${API_BASE}/pos/products`, {
      ...authHeaders(),
      params,
    });
  } catch (error) {
    handleAuthError(error);
  }
}

export async function checkoutPosOrder(payload) {
  try {
    return await axios.post(`${API_BASE}/pos/checkout`, payload, authHeaders());
  } catch (error) {
    handleAuthError(error);
  }
}