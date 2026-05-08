import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const { rows } = await pool.query("SELECT store_id, category FROM tickets");

    const totalTickets = rows.length;
    const storeCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();

    rows.forEach((t) => {
      if (t.store_id) storeCounts.set(t.store_id, (storeCounts.get(t.store_id) || 0) + 1);
      if (t.category) categoryCounts.set(t.category, (categoryCounts.get(t.category) || 0) + 1);
    });

    const topStores = Array.from(storeCounts.entries())
      .map(([store_id, count]) => ({ store_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCategories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({ totalTickets, topStores, topCategories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
