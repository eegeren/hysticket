import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signStoreToken } from "@/lib/store-session";

export async function POST(req: Request) {
  const body = await req.json();
  const storeId = String(body.storeId || "").trim();

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  const token = await signStoreToken({ storeId });

  const cookieStore = await cookies();
  cookieStore.set("hys_store", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
