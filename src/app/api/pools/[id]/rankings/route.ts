import { NextResponse } from "next/server";
import { getRankingsForPool } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rankings = await getRankingsForPool(id);
  return NextResponse.json(rankings);
}
