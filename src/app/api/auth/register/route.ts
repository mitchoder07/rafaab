import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body;
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  const existing = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  const user = await db.user.create({
    data: {
      name: String(name),
      email: String(email).toLowerCase(),
      password: hashPassword(String(password)),
    },
  });
  await setSession(user.id);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, phone: user.phone, role: user.role },
  });
}
