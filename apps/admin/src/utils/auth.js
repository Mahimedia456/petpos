export function setSession(token, user) {
  if (!token) return;

  localStorage.setItem("access_token", token);
  localStorage.setItem("token", token);

  if (user) {
    localStorage.setItem("admin_user", JSON.stringify(user));
  }
}

export function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("token")
  );
}

export function getUser() {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("token");
  localStorage.removeItem("admin_user");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}