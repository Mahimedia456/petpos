import axios from "axios";
import { API_BASE, getAuthToken } from "../lib/apiFetch";

function authHeaders() {
  const token = getAuthToken();

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