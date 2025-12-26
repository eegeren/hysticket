import { NextResponse } from "next/server";
import { signStoreToken } from "@/lib/store-session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const storeId = String(body.storeId || "").trim();
  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  const isProd = process.env.NODE_ENV === "production";
  const token = await signStoreToken({ storeId });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("hys_store", token, {
    httpOnly: true,
    secure: isProd, // allow non-HTTPS in local dev
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
