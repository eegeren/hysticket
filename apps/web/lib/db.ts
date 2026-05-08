import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id        TEXT NOT NULL,
        title           TEXT NOT NULL,
        description     TEXT NOT NULL,
        category        TEXT NOT NULL,
        impact          TEXT NOT NULL DEFAULT 'INFO',
        priority        TEXT NOT NULL DEFAULT 'P3',
        status          TEXT NOT NULL DEFAULT 'OPEN',
        requester_name  TEXT NOT NULL DEFAULT '',
        full_name       TEXT NOT NULL DEFAULT '',
        device_id       TEXT,
        severity        TEXT NOT NULL DEFAULT 'INFO',
        assigned_to     TEXT,
        resolution_note TEXT,
        close_code      TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id   TEXT NOT NULL,
        action     TEXT NOT NULL,
        path       TEXT NOT NULL,
        metadata   JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_store_id   ON tickets(store_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_status     ON tickets(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC)`);
  } catch (e) {
    console.error("DB init error:", e);
  }
}

initDb();

export default pool;
