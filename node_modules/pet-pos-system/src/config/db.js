import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, "../../.env");

/**
 * Local development:
 * Loads apps/api/.env
 *
 * Vercel:
 * Uses process.env from Vercel dashboard.
 */
dotenv.config({ path: envPath });

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL missing.");
  console.error("Local env path checked:", envPath);
  console.error("NODE_ENV:", process.env.NODE_ENV);
  console.error("VERCEL:", process.env.VERCEL);

  throw new Error("DATABASE_URL is missing. Add it in Vercel API project environment variables.");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },

  /**
   * Serverless safe pool settings.
   * Keep this low for Vercel + Supabase pooler.
   */
  max: 3,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: true,
});

pool.on("error", (err) => {
  console.error("Supabase PostgreSQL pool error:", err);
});

export async function testDbConnection() {
  const result = await pool.query("select now() as now");
  return result.rows[0];
}