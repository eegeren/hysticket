import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoreToken } from "@/lib/store-session";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    console.log("POST /api/tickets hit");
    console.log("env url exists?", !!process.env.SUPABASE_URL, "service key?", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const cookieStore = await cookies();
    const token = cookieStore.get("hys_store")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId } = await verifyStoreToken(token);

    const body = await req.json();

    const full_name = String(body.full_name || "").trim();
    const device_id = body.device ? String(body.device).trim() : null;
    const category = String(body.category || "").trim();
    const severityRaw = String(body.severity || body.impact || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();

    if (!full_name || !category || !severityRaw || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const impact =
      severityRaw === "SALES_STOPPED" || severityRaw === "P1"
        ? "SALES_STOPPED"
        : severityRaw === "PARTIAL" || severityRaw === "P2"
          ? "PARTIAL"
          : "INFO";

    const priority = impact === "SALES_STOPPED" ? "P1" : impact === "PARTIAL" ? "P2" : "P3";

    const basePayload = {
      store_id: storeId,
      device_id,
      category,
      impact,
      priority,
      title,
      description,
    };

    let data;
    let error;

    // Try with requester_name (expected column)
    ({ data, error } = await supabaseServer
      .from("tickets")
      .insert([{ ...basePayload, requester_name: full_name }])
      .select("id")
      .single());

    // If requester_name missing, retry with full_name
    if (error && error.message.includes("requester_name")) {
      ({ data, error } = await supabaseServer
        .from("tickets")
        .insert([{ ...basePayload, full_name }])
        .select("id")
        .single());
    }

    // If still error, last fallback without name to avoid blocking
    if (error) {
      ({ data, error } = await supabaseServer.from("tickets").insert([basePayload]).select("id").single());
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (data?.id) {
      await supabaseServer.from("audit_logs").insert([
        {
          store_id: storeId,
          action: "ticket_create",
          path: "/store/tickets/new",
          metadata: { ticketId: data.id },
        },
      ]);
      return NextResponse.json({ ok: true, ticketId: data.id });
    }

    return NextResponse.json({ ok: true, ticketId: null });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
