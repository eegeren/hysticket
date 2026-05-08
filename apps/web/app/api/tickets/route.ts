import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signStoreToken, verifyStoreToken } from "@/lib/store-session";
import pool from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendTicketEmail } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
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

    if (!storeId) {
      storeId = String(body.storeId || body.store_id || body.store || "").trim();
    }

    if (!storeId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const full_name = String(body.full_name || body.requester_name || "").trim();
    const device_id = body.device ? String(body.device).trim() : null;
    const category = String(body.category || "").trim();
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

    const { rows } = await pool.query(
      `INSERT INTO tickets (store_id, title, description, category, impact, priority, requester_name, full_name, device_id, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [storeId, title, description, category, impact, priority, full_name, full_name, device_id, severityRaw]
    );

    const ticketId = rows[0].id;

    const adminLink = `${
      process.env.NEXT_PUBLIC_APP_URL || "https://hys-it-ticket.vercel.app"
    }/admin/tickets/${ticketId}`;
    const notificationText = [
      "Yeni Ariza Kaydi",
      "",
      `Magaza: ${storeId}`,
      `Bildiren: ${full_name}`,
      `Kategori: ${category}`,
      `Seviye: ${severityRaw}`,
      `Etki: ${impact}`,
      `Oncelik: ${priority}`,
      device_id ? `Cihaz: ${device_id}` : "",
      "",
      `Baslik: ${title}`,
      "",
      `Aciklama: ${description}`,
      "",
      `Admin: ${adminLink}`,
      `Ticket ID: ${ticketId}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await sendTelegramMessage(
        [
          "🆕 Yeni Arıza Kaydı",
          "",
          `🏬 Mağaza: ${storeId}`,
          `👤 Bildiren: ${full_name}`,
          `📂 Kategori: ${category}`,
          `⚠️ Seviye: ${severityRaw}`,
          `🎯 Etki: ${impact}`,
          `🚨 Öncelik: ${priority}`,
          device_id ? `💻 Cihaz: ${device_id}` : "",
          "",
          `📝 Başlık: ${title}`,
          "",
          `📄 Açıklama: ${description}`,
          "",
          `🔗 Admin: ${adminLink}`,
          `🆔 Ticket ID: ${ticketId}`,
        ]
          .filter(Boolean)
          .join("\n")
      );
    } catch (telegramErr) {
      console.error("Telegram notification failed (non-fatal):", telegramErr);
    }

    try {
      const to = process.env.NOTIFY_EMAIL_TO;
      const from = process.env.RESEND_FROM_EMAIL;

      if (to && from) {
        await sendTicketEmail({
          to,
          from,
          subject: `[HYS] Yeni Ticket #${ticketId} - ${title}`,
          text: notificationText,
        });
      } else {
        console.warn("Email notification skipped: NOTIFY_EMAIL_TO or RESEND_FROM_EMAIL missing");
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-fatal):", emailErr);
    }

    await pool.query(
      `INSERT INTO audit_logs (store_id, action, path, metadata) VALUES ($1, $2, $3, $4)`,
      [storeId, "ticket_create", "/store/tickets/new", JSON.stringify({ ticketId })]
    );

    const res = NextResponse.json({ ok: true, ticketId });

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
