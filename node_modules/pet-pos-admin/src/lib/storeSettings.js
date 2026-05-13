import apiFetch from "./apiFetch";

let settingsCache = null;

export async function getStoreSettings(force = false) {
  if (settingsCache && !force) return settingsCache;

  const res = await apiFetch("/admin/settings/store");
  const json = await res.json();

  if (!json?.ok) {
    throw new Error(json?.message || "Failed to load store settings.");
  }

  settingsCache = json.data;
  return settingsCache;
}

export function clearStoreSettingsCache() {
  settingsCache = null;
}

export function formatMoney(value, settings) {
  const symbol = settings?.currency_symbol || "Rs";
  return `${symbol} ${Number(value || 0).toLocaleString()}`;
}