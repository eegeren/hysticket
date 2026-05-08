import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const adminPassword = req.headers.get("x-admin-password") || "";
  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const priorityFilter = searchParams.get("priority");
  const storeFilter = searchParams.get("store_id");
  const limit = Math.min(Number(searchParams.get("limit") || "200"), 500);

  const conditions: string[] = [];
  const values: any[] = [];

  if (statusFilter) { values.push(statusFilter); conditions.push(`status = $${values.length}`); }
  if (priorityFilter) { values.push(priorityFilter); conditions.push(`priority = $${values.length}`); }
  if (storeFilter) { values.push(storeFilter); conditions.push(`store_id = $${values.length}`); }

  values.push(limit);
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT id, store_id, title, category, impact, priority, status, created_at FROM tickets ${where} ORDER BY created_at DESC LIMIT $${values.length}`;

  try {
    const { rows } = await pool.query(sql, values);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
