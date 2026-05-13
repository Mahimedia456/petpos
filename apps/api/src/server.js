import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, "../.env");

dotenv.config({ path: envPath });

const app = express();

const bootErrors = [];

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",

  "https://petpos-9ujf.vercel.app",

  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.APP_URL,
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) return true;

  if (/^https:\/\/petpos-[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    console.error("CORS blocked origin:", origin);
    console.error("Allowed origins:", allowedOrigins);

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Pet POS API is running.",
    service: "pet-pos-api",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "pet-pos-api",
    envLoaded: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    environment: process.env.NODE_ENV || "development",
    vercel: process.env.VERCEL || "0",
    allowedOrigins,
    bootErrors,
  });
});

let pool = null;
let authMiddleware = null;

async function loadDbAndMiddleware() {
  try {
    const dbModule = await import("./config/db.js");
    const authModule = await import("./middleware/auth.js");

    pool = dbModule.pool;
    authMiddleware = authModule.authMiddleware;

    console.log("DB and auth middleware loaded.");
  } catch (error) {
    console.error("Failed to load DB/auth middleware:", error);

    bootErrors.push({
      area: "db-auth",
      message: error.message,
      stack: error.stack,
    });
  }
}

async function mountSimpleRoute(pathName, importer, exportName = "default") {
  try {
    const mod = await importer();
    const router = mod[exportName];

    if (!router) {
      throw new Error(`Route export missing: ${exportName}`);
    }

    app.use(pathName, router);

    console.log(`Mounted route: ${pathName}`);
  } catch (error) {
    console.error(`Failed to mount route ${pathName}:`, error);

    bootErrors.push({
      area: `route:${pathName}`,
      message: error.message,
      stack: error.stack,
    });
  }
}

async function mountFactoryRoute(pathName, importer, exportName = "default") {
  try {
    if (!pool || !authMiddleware) {
      throw new Error("pool/authMiddleware not loaded");
    }

    const mod = await importer();
    const routeFactory = mod[exportName];

    if (typeof routeFactory !== "function") {
      throw new Error(`Route factory export is not a function: ${exportName}`);
    }

    const router = routeFactory({
      pool,
      authMiddleware,
    });

    app.use(pathName, router);

    console.log(`Mounted factory route: ${pathName}`);
  } catch (error) {
    console.error(`Failed to mount factory route ${pathName}:`, error);

    bootErrors.push({
      area: `factory-route:${pathName}`,
      message: error.message,
      stack: error.stack,
    });
  }
}

await loadDbAndMiddleware();

/**
 * Auth/Public routes
 */
await mountSimpleRoute("/api/auth", () =>
  import("./modules/auth/auth.routes.js")
);

await mountSimpleRoute("/api/dashboard", () =>
  import("./modules/dashboard/dashboard.routes.js")
);

await mountSimpleRoute("/api/pos", () => import("./modules/pos/pos.routes.js"));

await mountSimpleRoute("/api/products", () =>
  import("./modules/products/products.routes.js")
);

await mountSimpleRoute("/api/categories", () =>
  import("./modules/categories/categories.routes.js")
);

/**
 * Admin aliases for existing modules
 */
await mountSimpleRoute("/api/admin/dashboard", () =>
  import("./modules/dashboard/dashboard.routes.js")
);

await mountSimpleRoute("/api/admin/pos", () =>
  import("./modules/pos/pos.routes.js")
);

await mountSimpleRoute("/api/admin/products", () =>
  import("./modules/products/products.routes.js")
);

await mountSimpleRoute("/api/admin/categories", () =>
  import("./modules/categories/categories.routes.js")
);

/**
 * Admin factory modules
 */
await mountFactoryRoute("/api/admin", () =>
  import("./modules/inventory/inventory.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/orders/orders.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/customers/customers.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/delivery/delivery.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/promotions/promotions.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/reports/reports.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/whatsapp/whatsapp.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/settings/settings.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/users/users.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/audit/audit.routes.js")
);

await mountFactoryRoute("/api/admin", () =>
  import("./modules/woocommerce/woocommerce.routes.js")
);

app.get("/api/db-health", async (req, res, next) => {
  try {
    if (!pool) {
      return res.status(500).json({
        ok: false,
        message: "Database pool not loaded.",
        bootErrors,
      });
    }

    const result = await pool.query("select now() as now");

    res.json({
      ok: true,
      service: "pet-pos-api",
      database: "connected",
      now: result.rows[0]?.now,
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "API route not found.",
    method: req.method,
    path: req.originalUrl,
    bootErrors,
  });
});

app.use((error, req, res, next) => {
  console.error("API Error:", error);

  if (error.message && error.message.startsWith("CORS blocked origin")) {
    return res.status(403).json({
      ok: false,
      message: error.message,
    });
  }

  res.status(error.status || 500).json({
    ok: false,
    message: error.message || "Internal server error.",
    bootErrors,
  });
});

if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`Pet POS API running on http://localhost:${port}`);
  });
}

export default app;