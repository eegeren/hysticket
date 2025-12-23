import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyStoreToken } from "@/lib/store-session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hys_store")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { storeId } = await verifyStoreToken(token);
    return NextResponse.json({ storeId });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unauthorized" }, { status: 401 });
  }
}
