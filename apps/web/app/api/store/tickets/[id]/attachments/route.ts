import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ error: `Not implemented for ticket ${id}` }, { status: 501 });
}
