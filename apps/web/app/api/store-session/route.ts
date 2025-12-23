import { NextResponse } from "next/server";

export async function POST() {
  // Legacy endpoint; forward users to the new login route
  return NextResponse.redirect(new URL("/api/store/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
