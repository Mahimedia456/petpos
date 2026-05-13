import { api } from "./api";

export function getProducts(params = {}) {
  return api.get("/products", { params });
}

export function getProduct(id) {
  return api.get(`/products/${id}`);
}

export function createProduct(payload) {
  return api.post("/products", payload);
}

export function updateProduct(id, payload) {
  return api.put(`/products/${id}`, payload);
}

export function deleteProduct(id) {
  return api.delete(`/products/${id}`);
}