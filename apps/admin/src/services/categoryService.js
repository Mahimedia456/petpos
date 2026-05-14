import axios from "axios";

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("token")
  );
}

function authHeaders() {
  const token = getToken();

  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
}

function handleAuthError(error) {
  if (error?.response?.status === 401) {
    console.warn("Unauthorized category request. Token missing/expired.");

    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_user");

    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  throw error;
}

export async function getCategories(params = {}) {
  try {
    return await axios.get(`${API_BASE}/categories`, {
      ...authHeaders(),
      params,
    });
  } catch (error) {
    handleAuthError(error);
  }
}

export async function getCategory(id) {
  try {
    return await axios.get(`${API_BASE}/categories/${id}`, authHeaders());
  } catch (error) {
    handleAuthError(error);
  }
}

export async function createCategory(payload) {
  try {
    return await axios.post(`${API_BASE}/categories`, payload, authHeaders());
  } catch (error) {
    handleAuthError(error);
  }
}

export async function updateCategory(id, payload) {
  try {
    return await axios.put(
      `${API_BASE}/categories/${id}`,
      payload,
      authHeaders()
    );
  } catch (error) {
    handleAuthError(error);
  }
}

export async function deleteCategory(id) {
  try {
    return await axios.delete(`${API_BASE}/categories/${id}`, authHeaders());
  } catch (error) {
    handleAuthError(error);
  }
}