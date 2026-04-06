"use client";

import { cn } from "@/lib/utils";

const CHART_BAR_HEIGHTS = ["46%", "70%", "38%", "82%", "58%", "64%", "30%", "78%", "52%", "68%", "44%", "74%"];

/** Individual skeleton element */
interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = "rect", width, height }: SkeletonProps) {
  const baseStyles = "skeleton-shimmer";

  const variantStyles = {
    rect: "",
    circle: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ width, height }}
      role="presentation"
      aria-label="Loading..."
    />
  );
}

/** Pre-built skeleton for a link card */
export function LinkCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-start gap-3">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="80%" height={14} />
          <div className="flex gap-2 mt-3">
            <Skeleton variant="rect" width={48} height={20} className="rounded-full" />
            <Skeleton variant="rect" width={56} height={20} className="rounded-full" />
          </div>
        </div>
        <Skeleton variant="rect" width={64} height={28} className="rounded-lg" />
      </div>
    </div>
  );
}

/** Pre-built skeleton for stats cards */
export function StatsCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Skeleton variant="text" width="40%" height={14} />
      <Skeleton variant="text" width="30%" height={28} className="mt-2" />
      <Skeleton variant="text" width="60%" height={12} className="mt-3" />
    </div>
  );
}

/** Pre-built skeleton for a chart */
export function ChartSkeleton() {
  return (
    <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Skeleton variant="text" width="30%" height={18} className="mb-4" />
      <div className="flex items-end gap-1.5 h-40">
        {CHART_BAR_HEIGHTS.map((height, i) => (
          <Skeleton
            key={i}
            variant="rect"
            className="flex-1 rounded-t"
            height={height}
          />
        ))}
      </div>
    </div>
  );
}
