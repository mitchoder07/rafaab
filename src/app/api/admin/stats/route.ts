import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";
import { serializeProduct } from "@/lib/serialize";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const [
    totalProducts,
    totalOrders,
    totalUsers,
    lowStockProducts,
    orders,
    recentProducts,
  ] = await Promise.all([
    db.product.count(),
    db.order.count(),
    db.user.count(),
    db.product.count({ where: { stock: { lte: 10 } } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    }),
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { category: true },
    }),
  ]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = await db.order.count({
    where: { status: { in: ["confirmed", "processing"] } },
  });
  const shippedOrders = await db.order.count({
    where: { status: { in: ["shipped", "out_for_delivery"] } },
  });
  const deliveredOrders = await db.order.count({
    where: { status: "delivered" },
  });

  // Revenue by category (last 30 days)
  const since = new Date(Date.now() - 30 * 86400000);
  const recentOrdersWithItems = await db.order.findMany({
    where: { createdAt: { gte: since } },
    include: { items: { include: { product: { include: { category: true } } } } },
  });
  const categoryRevenue = new Map<string, number>();
  for (const o of recentOrdersWithItems) {
    for (const it of o.items) {
      const catName = it.product?.category?.name || "Other";
      categoryRevenue.set(catName, (categoryRevenue.get(catName) || 0) + it.price * it.quantity);
    }
  }
  const revenueByCategory = Array.from(categoryRevenue.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return NextResponse.json({
    stats: {
      totalProducts,
      totalOrders,
      totalUsers,
      revenue,
      lowStockCount: lowStockProducts,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
    },
    recentOrders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      itemCount: o.items.length,
    })),
    recentProducts: recentProducts.map(serializeProduct),
    revenueByCategory,
  });
}
