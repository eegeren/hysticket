import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signStoreToken, verifyStoreToken } from "@/lib/store-session";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Telegram message sender (inline to avoid changing app structure).
 * Uses env vars:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_CHAT_ID (example: -5023082894)
 */
async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdRaw = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatIdRaw) {
    console.warn("Telegram env missing");
    return;
  }

  const chatId = Number(chatIdRaw);
  if (!Number.isFinite(chatId)) {
    console.error("Telegram chat id is not a number:", chatIdRaw);
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    console.error("Telegram send failed:", resp.status, t);
  } else {
    console.log("Telegram sent OK");
  }
}

export async function POST(req: Request) {
  try {
    console.log("POST /api/tickets hit");
    console.log(
      "env url exists?",
      !!process.env.SUPABASE_URL,
      "service key?",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await req.json();

    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get("hys_store")?.value;

    let storeId = "";
    if (tokenFromCookie) {
      try {
        ({ storeId } = await verifyStoreToken(tokenFromCookie));
      } catch (err) {
        console.warn("hys_store token verify failed, will fallback to body storeId", err);
      }
    }

    // Fallback for cases where cookie is not set (local/prod misconfig). Accept both camelCase and snake_case.
    if (!storeId) {
      storeId = String(body.storeId || body.store_id || body.store || "").trim();
    }

    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const full_name = String(body.full_name || body.requester_name || "").trim();
    const device_id = body.device ? String(body.device).trim() : null;
    const category = String(body.category || "").trim();

    // IMPORTANT: severity is NOT NULL in DB in your setup; default to INFO to avoid 500
    const severityRaw = String(body.severity || body.impact || "INFO").trim() || "INFO";

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
      // keep severity for DB constraint (and reporting)
      severity: severityRaw,
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
      if (msg.includes("severity")) dropKeys.push("severity"); // just in case older schema
      if (dropKeys.length > 0) {
        for (const k of dropKeys) delete payload[k];
        ({ data, error } = await tryInsert(payload));
      }
    }

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Insert failed" }, { status: 500 });
    }

    // ---- TELEGRAM NOTIFICATION (WAIT FOR IT) ----
    // We await this to avoid serverless runtime shutting down before the request completes.
    const adminLink = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://hys-it-ticket.vercel.app"
    }/admin/tickets/${data.id}`;

    await sendTelegramMessage(
      [
        "Yeni Arıza Kaydı",
        "",
        `Mağaza: ${storeId}`,
        `Bildiren: ${full_name}`,
        `Kategori: ${category}`,
        `Seviye: ${severityRaw}`,
        `Etki: ${impact}`,
        `Öncelik: ${priority}`,
        device_id ? `Cihaz: ${device_id}` : "",
        "",
        `Başlık: ${title}`,
        "",
        `Açıklama: ${description}`,
        "",
        `Admin: ${adminLink}`,
        `Ticket ID: ${data.id}`,
      ]
        .filter(Boolean)
        .join("\n")
    );
    // --------------------------------------------

    // audit log
    await supabaseServer.from("audit_logs").insert([
      {
        store_id: storeId,
        action: "ticket_create",
        path: "/store/tickets/new",
        metadata: { ticketId: data.id },
      },
    ]);

    const res = NextResponse.json({ ok: true, ticketId: data.id });

    // If the storeId came from the body, set a fresh cookie to persist the session.
    if (!tokenFromCookie && storeId) {
      const isProd = process.env.NODE_ENV === "production";
      const newToken = await signStoreToken({ storeId });
      res.cookies.set("hys_store", newToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}