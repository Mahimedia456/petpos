export function formatCurrency(value) {
  return "Rs. " + Number(value || 0).toLocaleString();
}