import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoreToken } from "@/lib/store-session";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hys_store")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId } = await verifyStoreToken(token);

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status_filter") || undefined;

    const query = supabaseServer.from("tickets").select("*").eq("store_id", storeId).order("created_at", { ascending: false });
    if (statusFilter) {
      query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
