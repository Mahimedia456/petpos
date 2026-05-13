import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const envPath = path.resolve(currentDir, "../../.env");

dotenv.config({ path: envPath });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("Loaded env path:", envPath);
  throw new Error("DATABASE_URL is missing in apps/api/.env");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on("connect", () => {
  console.log("Connected to Supabase PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Supabase PostgreSQL pool error:", err);
});