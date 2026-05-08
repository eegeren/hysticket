import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoreToken } from "@/lib/store-session";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("hys_store")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { storeId } = await verifyStoreToken(token);

    const url = new URL(req.url);
    const requestedStoreId = url.searchParams.get("store_id");
    if (requestedStoreId && requestedStoreId !== storeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const statusFilter = url.searchParams.get("status_filter") || undefined;
    const priorityFilter = url.searchParams.get("priority_filter") || undefined;
    const categoryFilter = url.searchParams.get("category_filter") || undefined;
    const query = (url.searchParams.get("q") || "").trim();

    const values: any[] = [storeId];
    let sql = "SELECT * FROM tickets WHERE store_id = $1";
    if (statusFilter) {
      values.push(statusFilter);
      sql += ` AND status = $${values.length}`;
    }
    if (priorityFilter) {
      values.push(priorityFilter);
      sql += ` AND priority = $${values.length}`;
    }
    if (categoryFilter) {
      values.push(categoryFilter);
      sql += ` AND category = $${values.length}`;
    }
    if (query) {
      values.push(`%${query}%`);
      const idx = values.length;
      sql += ` AND (id::text ILIKE $${idx} OR title ILIKE $${idx} OR COALESCE(description, '') ILIKE $${idx} OR COALESCE(device_id, '') ILIKE $${idx})`;
    }
    sql += " ORDER BY created_at DESC";

    const { rows } = await pool.query(sql, values);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
