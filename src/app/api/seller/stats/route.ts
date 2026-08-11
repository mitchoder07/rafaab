import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSellerStore } from "@/lib/seller";

export async function GET() {
  const store = await getSellerStore();
  if (!store) {
    return NextResponse.json({ error: "Seller access required" }, { status: 403 });
  }
  const [
    totalProducts,
    pendingProducts,
    lowStock,
    myOrderItems,
    recentOrders,
    earnings,
  ] = await Promise.all([
    db.product.count({ where: { storeId: store.id } }),
    db.product.count({ where: { storeId: store.id, approvalStatus: "pending" } }),
    db.product.count({ where: { storeId: store.id, stock: { lte: 10 } } }),
    db.orderItem.findMany({
      where: { storeId: store.id },
      select: { id: true, price: true, quantity: true, orderId: true, earning: true },
    }),
    db.orderItem.findMany({
      where: { storeId: store.id },
      distinct: ["orderId"],
      take: 5,
      orderBy: { order: { createdAt: "desc" } },
      include: { order: { select: { id: true, orderNumber: true, status: true, createdAt: true, total: true } } },
    }),
    db.sellerEarning.findMany({
      where: { storeId: store.id },
      select: { netAmount: true, status: true },
    }),
  ]);

  const grossRevenue = myOrderItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const releasedEarnings = earnings.filter((e) => e.status === "released").reduce((s, e) => s + e.netAmount, 0);

  return NextResponse.json({
    stats: {
      totalProducts,
      pendingProducts,
      lowStockCount: lowStock,
      orderCount: new Set(myOrderItems.map((oi) => oi.orderId)).size,
      grossRevenue,
      availableBalance: store.availableBalance,
      pendingBalance: store.pendingBalance,
      lifetimeEarnings: store.lifetimeEarnings,
      releasedEarnings,
      commissionRate: store.commissionRate,
      rating: store.rating,
      numReviews: store.numReviews,
    },
    recentOrders: recentOrders.map((oi) => ({
      id: oi.order.id,
      orderNumber: oi.order.orderNumber,
      status: oi.order.status,
      createdAt: oi.order.createdAt.toISOString(),
      total: oi.order.total,
    })),
  });
}
