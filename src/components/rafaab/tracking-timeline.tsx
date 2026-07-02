"use client";

import { motion } from "framer-motion";
import { Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrackingEventData } from "@/lib/types";
import {
  TRACKING_STEPS,
  isStepReached,
  getEventForStep,
} from "./tracking-steps";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackingTimeline({
  status,
  events,
  compact = false,
}: {
  status: string;
  events?: TrackingEventData[];
  compact?: boolean;
}) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <XCircle width={16} height={16} />
        <span className="font-semibold">Order cancelled</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", compact ? "py-1" : "py-2")}>
      {/* progress line background */}
      <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border" />
      {/* progress line fill */}
      <motion.div
        initial={{ height: 0 }}
        animate={{
          height: `${(getProgressFill(status) * 100)}%`,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute left-[15px] top-4 w-0.5 bg-primary"
        style={{ maxHeight: "calc(100% - 32px)" }}
      />

      <div className="relative space-y-4">
        {TRACKING_STEPS.map((step) => {
          const state = isStepReached(step.key, status);
          const event = getEventForStep(events, step.key);
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative flex items-start gap-3">
              <div
                className={cn(
                  "z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary bg-primary/10 text-primary",
                  state === "todo" && "border-border bg-background text-muted-foreground",
                  state === "cancelled" && "border-border bg-background text-muted-foreground"
                )}
              >
                {state === "done" ? (
                  <Icon width={15} height={15} />
                ) : state === "current" ? (
                  <>
                    <Icon width={15} height={15} />
                    <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary opacity-40" />
                  </>
                ) : (
                  <Icon width={15} height={15} className="opacity-40" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      state === "todo" && "text-muted-foreground",
                      state === "current" && "text-primary"
                    )}
                  >
                    {step.label}
                  </p>
                  {event && (
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock width={11} height={11} />
                      {formatDateTime(event.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {event ? event.note : state === "todo" ? step.description : step.description}
                </p>
                {event?.location && !compact && (
                  <p className="mt-0.5 text-[11px] font-medium text-foreground/70">📍 {event.location}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getProgressFill(status: string): number {
  const idx = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"].indexOf(status);
  if (idx === -1) return 0;
  // fill proportionally across the 4 gaps between 5 steps
  return idx / 4;
}
