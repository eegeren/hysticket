import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

type RouteParams = { params: { id: string } };

const allowedFields = ["status", "priority", "assigned_to", "resolution_note", "close_code"] as const;

export async function PATCH(req: Request, { params }: RouteParams) {
  const adminPassword = req.headers.get("x-admin-password") || "";
  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const ticketId = params.id;
  const { data, error } = await supabaseServer
    .from("tickets")
    .update(updates)
    .eq("id", ticketId)
    .select("*")
    .single();

  if (error?.code === "PGRST116" || error?.details?.includes("Row not found")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
