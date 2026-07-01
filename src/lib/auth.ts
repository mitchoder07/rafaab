import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { cookies } from "next/headers";

const SESSION_SECRET =
  process.env.SESSION_SECRET || "rafaab-dev-secret-change-in-production-9f2k4";

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const test = scryptSync(plain, salt, 64);
    const real = Buffer.from(hash, "hex");
    return test.length === real.length && timingSafeEqual(test, real);
  } catch {
    return false;
  }
}

function sign(userId: string): string {
  const mac = createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  return `${userId}.${mac}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx === -1) return null;
  const userId = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  try {
    const a = Buffer.from(mac, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b) ? userId : null;
  } catch {
    return null;
  }
}

const COOKIE_NAME = "rafaab_session";

export async function setSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}
