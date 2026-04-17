import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const adminPassword = req.headers.get("x-admin-password") || "";
  if (!process.env.ADMIN_PASSWORD || adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticketId = id;
  const { data, error } = await supabaseServer.from("tickets").select("*").eq("id", ticketId).single();

  if (error?.code === "PGRST116" || error?.details?.includes("Row not found")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
