import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoreToken } from "@/lib/store-session";
import pool from "@/lib/db";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const cookieStore = await cookies();
    const token = cookieStore.get("hys_store")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId } = await verifyStoreToken(token);

    const url = new URL(req.url);
    const requestedStoreId = url.searchParams.get("store_id");
    if (requestedStoreId && requestedStoreId !== storeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      "SELECT * FROM tickets WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );

    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
