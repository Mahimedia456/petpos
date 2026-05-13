import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Search, UserCircle } from "lucide-react";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/pos": "Point of Sale",
  "/products": "Products",
  "/categories": "Categories",
  "/inventory": "Inventory",
  "/inventory/adjust": "Stock Adjustment",
  "/inventory/low-stock": "Low Stock",
  "/inventory/expiry": "Expiry Tracking",
  "/inventory/movements": "Inventory Movements",
  "/orders": "Orders",
  "/customers": "Customers & Pets",
  "/delivery/orders": "Delivery Orders",
  "/delivery/riders": "Riders",
  "/promotions": "Promotions",
  "/reports": "Reports",
  "/whatsapp/orders": "WhatsApp Orders",
  "/whatsapp/templates": "WhatsApp Templates",
  "/settings": "Store Settings",
  "/users": "Users",
  "/roles-permissions": "Roles & Permissions",
  "/activity-logs": "Activity Logs",
  "/printing/barcodes": "Barcode Labels",
  "/woocommerce": "WooCommerce",
  "/woocommerce/settings": "WooCommerce Settings",
  "/settings/woocommerce": "WooCommerce Settings",
};

const SEARCH_ITEMS = [
  { label: "Dashboard", path: "/dashboard", keywords: "overview home stats" },
  { label: "POS", path: "/pos", keywords: "sale cart checkout cashier" },
  { label: "Products", path: "/products", keywords: "items catalog stock" },
  { label: "Categories", path: "/categories", keywords: "product groups" },
  { label: "Inventory", path: "/inventory", keywords: "stock adjustment expiry low stock" },
  { label: "Stock Adjustment", path: "/inventory/adjust", keywords: "stock add remove adjust" },
  { label: "Low Stock", path: "/inventory/low-stock", keywords: "low stock reorder" },
  { label: "Expiry Tracking", path: "/inventory/expiry", keywords: "expiry expired near expiry" },
  { label: "Inventory Movements", path: "/inventory/movements", keywords: "movement history stock" },
  { label: "Orders", path: "/orders", keywords: "sales order invoice receipt" },
  { label: "Customers & Pets", path: "/customers", keywords: "crm pets customer" },
  { label: "Delivery Orders", path: "/delivery/orders", keywords: "rider cod shipment" },
  { label: "Riders", path: "/delivery/riders", keywords: "delivery staff" },
  { label: "Promotions", path: "/promotions", keywords: "discount coupons offer" },
  { label: "Reports", path: "/reports", keywords: "analytics sales report" },
  { label: "WhatsApp Orders", path: "/whatsapp/orders", keywords: "chat manual order" },
  { label: "WhatsApp Templates", path: "/whatsapp/templates", keywords: "message template" },
  { label: "Barcode Labels", path: "/printing/barcodes", keywords: "print barcode label" },
  { label: "WooCommerce", path: "/woocommerce", keywords: "wordpress sync website" },
  { label: "Settings", path: "/settings", keywords: "store config receipt tax" },
  { label: "Users", path: "/users", keywords: "admin manager cashier" },
  { label: "Roles", path: "/roles-permissions", keywords: "permissions access" },
  { label: "Activity Logs", path: "/activity-logs", keywords: "audit trail logs" },
];

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("admin_user") || "null");
  } catch {
    return null;
  }
}

function resolveTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  if (pathname.startsWith("/orders/")) return "Order Detail";
  if (pathname.startsWith("/customers/")) return "Customer Detail";
  if (pathname.startsWith("/promotions/")) return "Promotion Detail";
  if (pathname.startsWith("/delivery/orders/")) return "Delivery Detail";
  if (pathname.startsWith("/printing/receipt/")) return "Print Receipt";
  if (pathname.startsWith("/users/")) return "User Form";

  return "Pet POS";
}

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const user = getCurrentUser();

  const pageTitle = resolveTitle(location.pathname);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return [];

    return SEARCH_ITEMS.filter((item) => {
      return (
        item.label.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
      );
    }).slice(0, 8);
  }, [query]);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_user");
    navigate("/login", { replace: true });
  }

  function openSearchResult(path) {
    setQuery("");
    navigate(path);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
            Pet POS System
          </p>
          <h2 className="truncate text-xl font-black text-slate-950">
            {pageTitle}
          </h2>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <div className="relative w-full max-w-xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules, orders, products..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-slate-950 focus:bg-white"
            />

            {results.length ? (
              <div className="absolute left-0 right-0 top-[54px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                {results.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => openSearchResult(item.path)}
                    className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {item.label}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        {item.path}
                      </p>
                    </div>

                    <span className="text-lg font-black text-slate-400">
                      →
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/pos"
            className="hidden rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 sm:block"
          >
            Open POS
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <UserCircle size={22} />
            </div>

            <div className="text-right">
              <p className="text-sm font-black text-slate-950">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs font-bold capitalize text-slate-400">
                {user?.role || "admin"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}