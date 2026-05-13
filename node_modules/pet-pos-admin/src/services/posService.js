import axios from "axios";
import { getToken } from "../utils/auth";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function authHeaders() {
  const token = getToken();

  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

export function getPosCategories() {
  return axios.get(`${API_BASE}/pos/categories`, authHeaders());
}

export function getPosProducts(params = {}) {
  return axios.get(`${API_BASE}/pos/products`, {
    ...authHeaders(),
    params,
  });
}

export function checkoutPosOrder(payload) {
  return axios.post(`${API_BASE}/pos/checkout`, payload, authHeaders());
}