const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export function getAuthToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("token")
  );
}

export default function apiFetch(path, options = {}) {
  const token = getAuthToken();

  const cleanPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${path}`;

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  return fetch(`${API_BASE}${cleanPath}`, {
    ...options,
    headers,
  });
}

export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options);

  let data = null;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw {
      response: {
        status: res.status,
        data,
      },
      message: data?.message || `Request failed with status ${res.status}`,
    };
  }

  return data;
}