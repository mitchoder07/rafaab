import { db } from "./db";
import { getSessionUserId } from "./auth";

export async function getAdminUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "admin") return null;
  return user;
}
