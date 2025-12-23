import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoreToken } from "@/lib/store-session";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("hys_store")?.value;
    let storeId: string | null = null;

    if (token) {
      const verified = await verifyStoreToken(token);
      storeId = verified.storeId;
    } else {
      const url = new URL(req.url);
      const requestedStoreId = url.searchParams.get("store_id");
      if (requestedStoreId) {
        storeId = requestedStoreId;
      }
    }
    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseServer
      .from("tickets")
      .select("*")
      .eq("id", id)
      .eq("store_id", storeId)
      .single();

    if (error?.code === "PGRST116" || error?.details?.includes("Row not found")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
