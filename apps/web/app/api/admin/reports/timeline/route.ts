import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get("days") || "30", 10);
  const days = Math.min(Math.max(isNaN(daysParam) ? 30 : daysParam, 1), 365);

  try {
    const { rows } = await pool.query(
      "SELECT created_at FROM tickets WHERE created_at >= NOW() - ($1 || ' days')::interval",
      [days]
    );

    const counts = new Map<string, number>();
    rows.forEach((t) => {
      const day = t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : "unknown";
      counts.set(day, (counts.get(day) || 0) + 1);
    });

    const timeline = Array.from(counts.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => (a.day < b.day ? -1 : 1));

    return NextResponse.json({ days, timeline });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
