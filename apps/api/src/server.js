import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./config/db.js";
import { authMiddleware } from "./middleware/auth.js";

import authRoutes from "./modules/auth/auth.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import posRoutes from "./modules/pos/pos.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";

import ordersRoutes from "./modules/orders/orders.routes.js";
import customersRoutes from "./modules/customers/customers.routes.js";
import deliveryRoutes from "./modules/delivery/delivery.routes.js";
import promotionsRoutes from "./modules/promotions/promotions.routes.js";
import reportsRoutes from "./modules/reports/reports.routes.js";
import whatsappRoutes from "./modules/whatsapp/whatsapp.routes.js";
import settingsRoutes from "./modules/settings/settings.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import auditRoutes from "./modules/audit/audit.routes.js";
import woocommerceRoutes from "./modules/woocommerce/woocommerce.routes.js";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, "../.env");

/**
 * Local development:
 * Loads apps/api/.env
 *
 * Vercel production:
 * Uses environment variables from Vercel dashboard.
 */
dotenv.config({ path: envPath });

const app = express();

/**
 * CORS
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:3000",

  // Production admin frontend
  "https://petpos-9ujf.vercel.app",

  // Env based frontend URLs
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.APP_URL,
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  if (origin.startsWith("http://localhost:")) return true;
  if (origin.startsWith("http://127.0.0.1:")) return true;

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

/**
 * Body parsers
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/**
 * Root / health
 */
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
  });
});

app.get("/api/db-health", async (req, res, next) => {
  try {
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

/**
 * Auth/Public routes
 */
app.use("/api/auth", authRoutes);

/**
 * Existing direct module routes
 */
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);

/**
 * Admin aliases for existing direct modules
 */
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/pos", posRoutes);
app.use("/api/admin/products", productsRoutes);
app.use("/api/admin/categories", categoriesRoutes);

/**
 * Admin factory modules
 */
app.use(
  "/api/admin",
  inventoryRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  ordersRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  customersRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  deliveryRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  promotionsRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  reportsRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  whatsappRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  settingsRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  usersRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  auditRoutes({
    pool,
    authMiddleware,
  })
);

app.use(
  "/api/admin",
  woocommerceRoutes({
    pool,
    authMiddleware,
  })
);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: "API route not found.",
    method: req.method,
    path: req.originalUrl,
  });
});

/**
 * Error handler
 */
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
  });
});

/**
 * Local development only.
 * Vercel serverless deployment must not call app.listen().
 */
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`Pet POS API running on http://localhost:${port}`);
  });
}

export default app;