import { NextResponse } from "next/server";

// Legacy endpoint; forward to the standard login route.
export async function POST(req: Request) {
  const target = new URL("/api/store/login", req.url);
  return NextResponse.redirect(target);
}
