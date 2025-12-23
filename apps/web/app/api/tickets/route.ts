import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoreToken } from "@/lib/store-session";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hys_store")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId } = await verifyStoreToken(token);

    const body = await req.json();

    const full_name = String(body.full_name || "").trim();
    const device = body.device ? String(body.device).trim() : null;
    const category = String(body.category || "").trim();
    const severity = String(body.severity || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();

    if (!full_name || !category || !severity || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("tickets")
      .insert([
        {
          store_id: storeId,
          full_name,
          device,
          category,
          severity,
          title,
          description,
        },
      ])
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabaseServer.from("audit_logs").insert([
      {
        store_id: storeId,
        action: "ticket_create",
        path: "/store/tickets/new",
        metadata: { ticketId: data.id },
      },
    ]);

    return NextResponse.json({ ok: true, ticketId: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
