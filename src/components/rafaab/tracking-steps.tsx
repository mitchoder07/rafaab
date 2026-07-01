import { Check, Clock, Package, Truck, MapPin, Home as HomeIcon, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TrackingEventData } from "@/lib/types";

export type TrackingStep = {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const TRACKING_STEPS: TrackingStep[] = [
  { key: "confirmed", label: "Order Placed", icon: Check, description: "We received your order" },
  { key: "processing", label: "Processing", icon: Package, description: "Packed at our warehouse" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "On its way to you" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin, description: "Arriving today" },
  { key: "delivered", label: "Delivered", icon: HomeIcon, description: "Order complete" },
];

const STATUS_ORDER = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"];

export function getTrackingProgress(status: string): number {
  if (status === "cancelled") return -1;
  const idx = STATUS_ORDER.indexOf(status);
  return idx; // 0..4, or -1
}

export function isStepReached(stepKey: string, currentStatus: string): "done" | "current" | "todo" | "cancelled" {
  if (currentStatus === "cancelled") return "cancelled";
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const curIdx = STATUS_ORDER.indexOf(currentStatus);
  if (curIdx === -1) return "todo";
  if (stepIdx < curIdx) return "done";
  if (stepIdx === curIdx) return "current";
  return "todo";
}

export function getEventForStep(events: TrackingEventData[] | undefined, stepKey: string): TrackingEventData | undefined {
  if (!events) return undefined;
  return [...events].reverse().find((e) => e.status === stepKey);
}
