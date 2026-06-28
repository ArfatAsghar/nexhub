import * as React from "react";

export interface StatCardProps {
  label: string;
  value: number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-lg text-ink">{value}</span>
      <span className="text-xs text-ink-faint">{label}</span>
    </div>
  );
}