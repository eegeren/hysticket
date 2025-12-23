import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signStoreToken } from "@/lib/store-session";

export async function POST(req: Request) {
  const body = await req.json();
  const storeId = String(body.storeId || "").trim();

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  // İstersen burada storeId'yi Supabase stores tablosuna göre doğrula (is_active vs.)
  const token = await signStoreToken({ storeId });

  cookies().set("hys_store", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 gün
  });

  return NextResponse.json({ ok: true });
}
