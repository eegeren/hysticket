import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const storeId = String(body.storeId || "");
    const action = String(body.action || "");
    const path = String(body.path || "");
    const metadata = (body.metadata ?? {}) as Record<string, unknown>;

    if (!storeId || !action || !path) {
      return NextResponse.json({ error: "storeId, action, path required" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("audit_logs").insert([{ store_id: storeId, action, path, metadata }]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
