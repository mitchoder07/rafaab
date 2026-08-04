import type { OrderData, TrackingEventData } from "./types";
import type { Order, OrderItem, TrackingEvent } from "@prisma/client";

type OrderWithItems = Order & { items: OrderItem[]; trackingEvents?: TrackingEvent[] };

export function serializeOrder(o: OrderWithItems): OrderData {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: o.subtotal,
    shipping: o.shipping,
    discount: o.discount,
    total: o.total,
    shippingAddress: JSON.parse(o.shippingAddress),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    estimatedDelivery: o.estimatedDelivery ? o.estimatedDelivery.toISOString() : null,
    carrier: o.carrier,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      title: it.title,
      image: it.image,
      price: it.price,
      quantity: it.quantity,
    })),
    trackingEvents: (o.trackingEvents || []).map(serializeTrackingEvent).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
  };
}

export function serializeTrackingEvent(t: TrackingEvent): TrackingEventData {
  return {
    id: t.id,
    status: t.status,
    note: t.note,
    location: t.location,
    createdAt: t.createdAt.toISOString(),
  };
}
