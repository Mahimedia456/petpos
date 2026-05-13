export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null");
  } catch {
    return null;
  }
}

export function getUserRole() {
  const user = getCurrentUser();
  return String(user?.role || "cashier").toLowerCase();
}

export function isAdmin() {
  return getUserRole() === "admin";
}

export function canAccessModule(moduleKey) {
  const user = getCurrentUser();

  if (!user) return false;

  if (String(user.role || "").toLowerCase() === "admin") {
    return true;
  }

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  const found = permissions.find((item) => item.module_key === moduleKey);

  return Boolean(found?.can_view);
}

export function canDo(moduleKey, action = "view") {
  const user = getCurrentUser();

  if (!user) return false;

  if (String(user.role || "").toLowerCase() === "admin") {
    return true;
  }

  const key = `can_${action}`;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  const found = permissions.find((item) => item.module_key === moduleKey);

  return Boolean(found?.[key]);
}