import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = req.headers.get("x-setup-secret") || new URL(req.url).searchParams.get("secret");
  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_store   ON audit_logs(store_id)`);

    return NextResponse.json({ ok: true, message: "Tables created successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
