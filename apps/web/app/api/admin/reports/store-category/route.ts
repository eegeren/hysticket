import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const { data, error } = await supabaseServer.from("tickets").select("store_id, category");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const counts = new Map<string, { store_id: string; category: string; count: number }>();

  data?.forEach((t) => {
    const key = `${t.store_id || "unknown"}__${t.category || "unknown"}`;
    const current = counts.get(key) || { store_id: t.store_id || "unknown", category: t.category || "unknown", count: 0 };
    current.count += 1;
    counts.set(key, current);
  });

  const result = Array.from(counts.values()).sort((a, b) => b.count - a.count);

  return NextResponse.json(result);
}
