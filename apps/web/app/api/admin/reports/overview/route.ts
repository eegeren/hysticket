import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseServer.from("tickets").select("store_id, category");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totalTickets = data?.length ?? 0;
  const storeCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  data?.forEach((t) => {
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
}
