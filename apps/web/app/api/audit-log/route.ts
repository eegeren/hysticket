import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import pool from "@/lib/db";
import { verifyStoreToken } from "@/lib/store-session";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("hys_store")?.value;

    let storeId = String(body.storeId || "");
    const action = String(body.action || "");
    const path = String(body.path || "");
    const metadata = (body.metadata ?? {}) as Record<string, unknown>;

    if (!storeId && token) {
      try {
        const verified = await verifyStoreToken(token);
        storeId = verified.storeId;
      } catch (err) {
        // ignore
      }
    }

    if (!storeId || !action || !path) {
      return NextResponse.json({ error: "storeId, action, path required" }, { status: 400 });
    }

    await pool.query(
      "INSERT INTO audit_logs (store_id, action, path, metadata) VALUES ($1, $2, $3, $4)",
      [storeId, action, path, JSON.stringify(metadata)]
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
