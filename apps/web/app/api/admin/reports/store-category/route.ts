import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const { rows } = await pool.query("SELECT store_id, category FROM tickets");

    const counts = new Map<string, { store_id: string; category: string; count: number }>();
    rows.forEach((t) => {
      const key = `${t.store_id || "unknown"}__${t.category || "unknown"}`;
      const current = counts.get(key) || { store_id: t.store_id || "unknown", category: t.category || "unknown", count: 0 };
      current.count += 1;
      counts.set(key, current);
    });

    const result = Array.from(counts.values()).sort((a, b) => b.count - a.count);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
