const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function apiFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${API_BASE}${cleanPath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}