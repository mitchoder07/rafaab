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

  const steps = TRACKING_STEPS;
  const currentIdx = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"].indexOf(status);

  return (
    <div className={cn(compact ? "py-1" : "py-2")}>
      <div className="flex flex-col">
        {steps.map((step, idx) => {
          const state = isStepReached(step.key, status);
          const event = getEventForStep(events, step.key);
          const Icon = step.icon;
          const isLast = idx === steps.length - 1;
          // This segment's connector is filled if current status is past this step
          const segmentFilled = currentIdx > idx;

          return (
            <div key={step.key} className="flex">
              {/* Icon + connector column — the connector extends down to meet the next icon */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition",
                    state === "done" && "border-primary bg-primary text-primary-foreground",
                    state === "current" && "border-primary bg-card text-primary",
                    state === "todo" && "border-border bg-card text-muted-foreground",
                    state === "cancelled" && "border-border bg-card text-muted-foreground"
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
                {/* Connector line: fills the space below this icon down to the next icon */}
                {!isLast && (
                  <div className={cn("w-0.5 flex-1", compact ? "my-1" : "my-1", segmentFilled ? "bg-primary" : "bg-border")} />
                )}
              </div>

              {/* Content column — its bottom padding creates the gap that the connector fills */}
              <div className={cn("flex-1 pl-3", isLast ? "pb-0" : compact ? "pb-3" : "pb-5")}>
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
                  {event ? event.note : step.description}
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
