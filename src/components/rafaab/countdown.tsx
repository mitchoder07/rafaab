"use client";

import { useEffect, useState } from "react";

function calc(target: number) {
  const now = Date.now();
  let diff = Math.max(0, target - now);
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000);
  diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  return { hours, minutes, seconds, done: target - now <= 0 };
}

export function Countdown({
  endsAt,
  className,
  variant = "dark",
}: {
  endsAt: string;
  className?: string;
  variant?: "dark" | "light";
}) {
  const target = new Date(endsAt).getTime();
  const [t, setT] = useState(() => calc(target));

  useEffect(() => {
    const id = setInterval(() => setT(calc(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (t.done) {
    return <span className={className}>Ended</span>;
  }

  const box =
    variant === "dark"
      ? "bg-neutral-900 text-white"
      : "bg-white/20 text-white backdrop-blur";
  const txt = variant === "dark" ? "text-neutral-500" : "text-white/70";

  return (
    <div className={`flex items-center gap-1 ${className || ""}`}>
      <span className={`text-[10px] font-medium ${txt} mr-1`}>ENDS IN</span>
      {[t.hours, t.minutes, t.seconds].map((v, i) => (
        <span key={i} className="flex items-center">
          <span
            className={`min-w-[28px] text-center rounded px-1.5 py-1 text-sm font-bold tabular-nums ${box}`}
          >
            {pad(v)}
          </span>
          {i < 2 && <span className={`mx-0.5 font-bold ${variant === "dark" ? "text-neutral-400" : "text-white"}`}>:</span>}
        </span>
      ))}
    </div>
  );
}
