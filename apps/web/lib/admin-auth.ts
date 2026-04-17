import { NextResponse } from "next/server";

export function requireAdmin(req: Request) {
  const pass = req.headers.get("x-admin-password");
  if (!pass || pass !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
