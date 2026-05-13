import { NavLink } from "react-router-dom";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  MessageCircle,
  Package,
  QrCode,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";
import logo from "../../assets/logo.webp";

const navGroups = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "POS Checkout", path: "/pos", icon: ShoppingCart },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", path: "/products", icon: Package },
      { label: "Categories", path: "/categories", icon: Tags },
      { label: "Inventory", path: "/inventory", icon: Boxes },
      { label: "Barcode Labels", path: "/printing/barcodes", icon: QrCode },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", path: "/orders", icon: ClipboardList },
      { label: "Customers & Pets", path: "/customers", icon: Users },
      { label: "Promotions", path: "/promotions", icon: BadgePercent },
    ],
  },
  {
    title: "Delivery",
    items: [
      { label: "Delivery Orders", path: "/delivery/orders", icon: Truck },
      { label: "Riders", path: "/delivery/riders", icon: UserCog },
    ],
  },
  {
    title: "Messaging",
    items: [
      { label: "WhatsApp Orders", path: "/whatsapp/orders", icon: MessageCircle },
      { label: "WhatsApp Templates", path: "/whatsapp/templates", icon: ReceiptText },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Reports", path: "/reports", icon: BarChart3 },
      { label: "Activity Logs", path: "/activity-logs", icon: FileClock },
    ],
  },
  {
    title: "Integrations",
    items: [
      { label: "WooCommerce", path: "/woocommerce", icon: Workflow },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Users", path: "/users", icon: Users },
      { label: "Roles", path: "/roles-permissions", icon: ShieldCheck },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[300px] border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-100 px-6 py-5">
          <img
            src={logo}
            alt="Pet Shop"
            className="h-14 w-auto max-w-[220px] object-contain"
          />

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                Store Online
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition",
                          isActive
                            ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                        ].join(" ")
                      }
                    >
                      <Icon size={18} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="rounded-3xl bg-slate-950 p-4 text-white">
            <div className="text-sm font-black">Quick Sale</div>
            <div className="mt-1 text-xs font-semibold text-slate-300">
              Open POS and scan products directly.
            </div>

            <NavLink
              to="/pos"
              className="mt-4 block rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-slate-950"
            >
              Open POS
            </NavLink>
          </div>
        </div>
      </div>
    </aside>
  );
}