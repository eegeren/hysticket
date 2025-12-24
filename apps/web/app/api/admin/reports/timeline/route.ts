import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get("days") || "30", 10);
  const days = Math.min(Math.max(isNaN(daysParam) ? 30 : daysParam, 1), 365);

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const { data, error } = await supabaseServer.from("tickets").select("created_at").gte("created_at", sinceIso);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, number>();
  data?.forEach((t) => {
    const day = t.created_at ? t.created_at.slice(0, 10) : "unknown";
    counts.set(day, (counts.get(day) || 0) + 1);
  });

  const timeline = Array.from(counts.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));

  return NextResponse.json({ days, timeline });
}
