import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true, phone: true, role: true },
  });
  return NextResponse.json({ user });
}
