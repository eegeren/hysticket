import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "").trim();

  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });
  if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "ADMIN_PASSWORD is not set" }, { status: 500 });

  if (password !== process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Token is just the admin password; client stores and sends as X-Admin-Password
  return NextResponse.json({ token: password });
}
