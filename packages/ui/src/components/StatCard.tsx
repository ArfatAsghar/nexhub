import * as React from "react";

export interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
}

export function StatCard({ label, value, suffix = "" }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-xl font-bold text-ink tabular-nums">
        {value.toLocaleString()}{suffix}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">{label}</span>
    </div>
  );
}