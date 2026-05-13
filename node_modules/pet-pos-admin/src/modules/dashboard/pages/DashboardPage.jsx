import { Link } from "react-router-dom";
import {
  BarChart3,
  Barcode,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Package,
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

const QUICK_ACTIONS = [
  {
    title: "Open POS",
    description: "Start checkout and scan products.",
    icon: ShoppingCart,
    path: "/pos",
    className: "bg-slate-950 text-white",
  },
  {
    title: "WhatsApp Order",
    description: "Create manual order from customer chat.",
    icon: MessageCircle,
    path: "/whatsapp/orders/new",
    className: "bg-emerald-600 text-white",
  },
  {
    title: "Add Product",
    description: "Create inventory product.",
    icon: Package,
    path: "/products/create",
    className: "bg-blue-600 text-white",
  },
  {
    title: "Reports",
    description: "Sales, inventory, COD and customer analytics.",
    icon: BarChart3,
    path: "/reports",
    className: "bg-purple-600 text-white",
  },
];

const MODULES = [
  {
    title: "Catalog & Inventory",
    description: "Products, categories, stock, expiry and barcode labels.",
    icon: Boxes,
    links: [
      { label: "Products", path: "/products", icon: Package },
      { label: "Categories", path: "/categories", icon: Tags },
      { label: "Inventory", path: "/inventory", icon: Boxes },
      { label: "Barcode Labels", path: "/printing/barcodes", icon: Barcode },
    ],
  },
  {
    title: "Sales & Customers",
    description: "Orders, promotions, customers, pets and receipts.",
    icon: ReceiptText,
    links: [
      { label: "Orders", path: "/orders", icon: ClipboardList },
      { label: "Customers & Pets", path: "/customers", icon: Users },
      { label: "Promotions", path: "/promotions", icon: Tags },
    ],
  },
  {
    title: "Delivery & COD",
    description: "Riders, delivery assignments and cash collection.",
    icon: Truck,
    links: [
      { label: "Delivery Orders", path: "/delivery/orders", icon: Truck },
      { label: "Riders", path: "/delivery/riders", icon: UserCog },
    ],
  },
  {
    title: "WhatsApp Sales",
    description: "Manual WhatsApp orders and reusable message templates.",
    icon: MessageCircle,
    links: [
      { label: "WhatsApp Orders", path: "/whatsapp/orders", icon: MessageCircle },
      { label: "Templates", path: "/whatsapp/templates", icon: ReceiptText },
    ],
  },
  {
    title: "Reports & Audit",
    description: "Business analytics and system activity tracking.",
    icon: BarChart3,
    links: [
      { label: "Reports", path: "/reports", icon: BarChart3 },
      { label: "Activity Logs", path: "/activity-logs", icon: ShieldCheck },
    ],
  },
  {
    title: "System & Integrations",
    description: "Store settings, users, roles and WooCommerce sync.",
    icon: Settings,
    links: [
      { label: "Settings", path: "/settings", icon: Settings },
      { label: "Users", path: "/users", icon: Users },
      { label: "Roles", path: "/roles-permissions", icon: ShieldCheck },
      { label: "WooCommerce", path: "/woocommerce", icon: Workflow },
    ],
  },
];

function ActionCard({ item }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      className={[
        "group overflow-hidden rounded-[30px] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
        item.className,
      ].join(" ")}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
        <Icon size={28} />
      </div>

      <h3 className="mt-6 text-xl font-black">{item.title}</h3>

      <p className="mt-2 max-w-xs text-sm font-semibold leading-6 opacity-80">
        {item.description}
      </p>
    </Link>
  );
}

function ModuleCard({ module }) {
  const Icon = module.icon;

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-950">
          <Icon size={28} />
        </div>

        <div className="min-w-0">
          <h3 className="text-xl font-black tracking-tight text-slate-950">
            {module.title}
          </h3>

          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {module.description}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {module.links.map((link) => {
          const LinkIcon = link.icon;

          return (
            <Link
              key={link.path}
              to={link.path}
              className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
            >
              <LinkIcon size={17} />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-sm">
        <div className="grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              <LayoutDashboard size={15} />
              Pet POS System
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Complete pet shop POS, inventory, CRM, delivery and WooCommerce
              operations.
            </h1>

            <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
              Manage walk-in sales, WhatsApp orders, pet customer profiles,
              stock movement, barcode labels, receipts, COD riders, reports,
              permissions and website sync from one clean admin dashboard.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/pos"
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                Start Sale
              </Link>

              <Link
                to="/reports"
                className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                View Reports
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/10 p-6">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-300">
              Active Modules
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                "POS",
                "Orders",
                "Inventory",
                "Customers",
                "Delivery",
                "Reports",
                "WhatsApp",
                "WooCommerce",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {QUICK_ACTIONS.map((item) => (
          <ActionCard key={item.path} item={item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {MODULES.map((module) => (
          <ModuleCard key={module.title} module={module} />
        ))}
      </section>
    </div>
  );
}