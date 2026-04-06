"use client";

import { Badge } from "@/components/ui/Badge";

interface HealthBadgeProps {
  status?: string;
}

const STATUS_META: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "error" | "info";
  }
> = {
  healthy: { label: "Healthy", variant: "success" },
  degraded: { label: "Needs attention", variant: "warning" },
  failing: { label: "Broken destinations", variant: "error" },
  broken: { label: "Broken", variant: "error" },
  unknown: { label: "Unchecked", variant: "default" },
};

export function HealthBadge({ status }: HealthBadgeProps) {
  const meta = STATUS_META[status || "unknown"] || STATUS_META.unknown;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
