import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user || !user.password || !verifyPassword(String(password), user.password)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  await setSession(user.id);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, phone: user.phone, role: user.role },
  });
}
