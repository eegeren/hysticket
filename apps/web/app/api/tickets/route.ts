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

    const full_name = String(body.full_name || body.requester_name || "").trim();
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

    const basePayload: Record<string, any> = {
      store_id: storeId,
      title,
      description,
      category,
      impact,
      priority,
      requester_name: full_name,
      full_name,
      device_id,
    };

    const tryInsert = async (payload: Record<string, any>) => {
      return supabaseServer.from("tickets").insert([payload]).select("id").single();
    };

    let payload = { ...basePayload };
    let { data, error } = await tryInsert(payload);

    if (error && error.message) {
      // If a column is missing, drop it and retry (handles schema drift)
      const msg = error.message.toLowerCase();
      const dropKeys: string[] = [];
      if (msg.includes("requester_name")) dropKeys.push("requester_name");
      if (msg.includes("full_name")) dropKeys.push("full_name");
      if (msg.includes("impact")) dropKeys.push("impact");
      if (msg.includes("priority")) dropKeys.push("priority");
      if (msg.includes("device_id")) dropKeys.push("device_id");
      if (dropKeys.length > 0) {
        for (const k of dropKeys) delete payload[k];
        ({ data, error } = await tryInsert(payload));
      }
    }

    if (error || !data) return NextResponse.json({ error: error?.message || "Insert failed" }, { status: 500 });

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
