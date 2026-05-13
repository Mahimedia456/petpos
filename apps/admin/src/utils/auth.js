export function setSession(token, user) {
  localStorage.setItem("access_token", token);
  localStorage.setItem("admin_user", JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null");
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("admin_user");
}