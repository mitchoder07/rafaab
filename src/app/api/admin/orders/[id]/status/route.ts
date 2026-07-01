import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/admin";

const STATUS_NOTES: Record<string, { note: string; location: string }> = {
  processing: { note: "Order packed and ready for dispatch.", location: "Rafaab Fulfillment Center" },
  shipped: { note: "Order handed over to carrier and in transit.", location: "Rafaab Logistics Hub" },
  out_for_delivery: { note: "Out for delivery to your address today.", location: "Local Distribution Center" },
  delivered: { note: "Order delivered successfully.", location: "Customer Address" },
  cancelled: { note: "Order has been cancelled.", location: "Rafaab System" },
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, note, location } = body as { status: string; note?: string; location?: string };

  const valid = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const meta = STATUS_NOTES[status] || { note: note || "Status updated.", location: location || "Rafaab System" };
  const updated = await db.order.update({
    where: { id },
    data: {
      status,
      paymentStatus: status === "delivered" && order.paymentMethod === "cod" ? "paid" : order.paymentStatus,
      trackingEvents: {
        create: {
          status,
          note: note || meta.note,
          location: location || meta.location,
        },
      },
    },
    include: { items: true, trackingEvents: true },
  });

  return NextResponse.json({ order: updated });
}
