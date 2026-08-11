import { db } from "./db";
import { getPlatformSettings } from "./seller";

type ProductForEarning = {
  id: string;
  storeId: string | null;
  discountPrice: number | null;
  price: number;
};

type OrderItemCreated = {
  id: string;
  productId: string;
  price: number;
  quantity: number;
};

// After creating order items, create SellerEarning rows for each item that belongs to a store.
// Also increments store.pendingBalance.
export async function applyEarningsOnOrder(
  orderItems: OrderItemCreated[],
  products: ProductForEarning[]
) {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const earningsToCreate: {
    orderItemId: string;
    storeId: string;
    grossAmount: number;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;
  }[] = [];
  const storeUpdates: { storeId: string; amount: number }[] = [];

  for (const item of orderItems) {
    const product = productMap.get(item.productId);
    if (!product || !product.storeId) continue;
    const gross = item.price * item.quantity;
    const store = await db.store.findUnique({
      where: { id: product.storeId },
      select: { commissionRate: true, status: true },
    });
    if (!store || store.status !== "approved") continue;
    const commissionRate = store.commissionRate;
    const commissionAmount = Math.round(gross * commissionRate * 100) / 100;
    const netAmount = Math.round((gross - commissionAmount) * 100) / 100;
    earningsToCreate.push({
      orderItemId: item.id,
      storeId: product.storeId,
      grossAmount: gross,
      commissionRate,
      commissionAmount,
      netAmount,
    });
    storeUpdates.push({ storeId: product.storeId, amount: netAmount });
  }

  if (earningsToCreate.length === 0) return;

  await db.$transaction([
    ...earningsToCreate.map((e) =>
      db.sellerEarning.create({ data: e })
    ),
    ...storeUpdates.reduce((acc, upd) => {
      const existing = acc.find((a) => a.storeId === upd.storeId);
      if (existing) {
        existing.amount += upd.amount;
      } else {
        acc.push({ ...upd });
      }
      return acc;
    }, [] as { storeId: string; amount: number }[]).map((upd) =>
      db.store.update({
        where: { id: upd.storeId },
        data: { pendingBalance: { increment: upd.amount } },
      })
    ),
  ]);
}

// On delivery: release pending earnings → available balance
export async function releaseEarningsOnDelivery(orderId: string) {
  const items = await db.orderItem.findMany({
    where: { orderId },
    include: { earning: true },
  });
  const releases = items
    .filter((it) => it.earning && it.earning.status === "pending")
    .map((it) => ({
      earningId: it.earning!.id,
      storeId: it.earning!.storeId,
      netAmount: it.earning!.netAmount,
    }));

  if (releases.length === 0) return;

  const storeIncrements = releases.reduce((acc, r) => {
    acc[r.storeId] = (acc[r.storeId] || 0) + r.netAmount;
    return acc;
  }, {} as Record<string, number>);

  await db.$transaction([
    ...releases.map((r) =>
      db.sellerEarning.update({
        where: { id: r.earningId },
        data: { status: "released", releasedAt: new Date() },
      })
    ),
    ...Object.entries(storeIncrements).map(([storeId, amount]) =>
      db.store.update({
        where: { id: storeId },
        data: {
          pendingBalance: { decrement: amount },
          availableBalance: { increment: amount },
          lifetimeEarnings: { increment: amount },
        },
      })
    ),
  ]);
}

// On cancellation: refund pending earnings, decrement store.pendingBalance
export async function refundEarningsOnCancel(orderId: string) {
  const items = await db.orderItem.findMany({
    where: { orderId },
    include: { earning: true },
  });
  const refunds = items
    .filter((it) => it.earning && it.earning.status === "pending")
    .map((it) => ({
      earningId: it.earning!.id,
      storeId: it.earning!.storeId,
      netAmount: it.earning!.netAmount,
    }));

  if (refunds.length === 0) return;

  const storeDecrements = refunds.reduce((acc, r) => {
    acc[r.storeId] = (acc[r.storeId] || 0) + r.netAmount;
    return acc;
  }, {} as Record<string, number>);

  await db.$transaction([
    ...refunds.map((r) =>
      db.sellerEarning.update({
        where: { id: r.earningId },
        data: { status: "refunded" },
      })
    ),
    ...Object.entries(storeDecrements).map(([storeId, amount]) =>
      db.store.update({
        where: { id: storeId },
        data: { pendingBalance: { decrement: amount } },
      })
    ),
  ]);
}
