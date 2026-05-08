import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

const allowedFields = ["status", "priority", "assigned_to", "resolution_note", "close_code"] as const;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const adminPassword = req.headers.get("x-admin-password") || "";
  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      values.push(body[field]);
      setClauses.push(`${field} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  values.push(id);
  const sql = `UPDATE tickets SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;

  try {
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const adminPassword = req.headers.get("x-admin-password") || "";
  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rowCount } = await pool.query("DELETE FROM tickets WHERE id = $1", [id]);
    if (rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
