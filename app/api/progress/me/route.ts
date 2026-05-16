import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { loadProgressForUser } from "@/lib/progress-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysParam = Number(url.searchParams.get("days"));
  const days =
    Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 365
      ? Math.floor(daysParam)
      : 30;

  const data = await loadProgressForUser(userId, days);
  return NextResponse.json(data);
}
