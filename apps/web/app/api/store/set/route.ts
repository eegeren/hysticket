import { NextResponse } from "next/server";
import { signStoreToken } from "@/lib/store-session";

export const runtime = "nodejs"; // önemli: edge değil

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = String(searchParams.get("storeId") || "").trim();

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  const token = await signStoreToken({ storeId });

  // Redirect ile set-cookie en deterministik yöntem
  const res = NextResponse.redirect(new URL("/store/tickets", req.url));

  res.cookies.set("hys_store", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Ek bir test cookie (httpOnly değil) — sadece teşhis için
  res.cookies.set("hys_store_test", "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
