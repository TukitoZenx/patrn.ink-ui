"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] border-[var(--color-border)]",
  primary: "bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/20",
  success: "bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]/20",
  warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)] border-[var(--color-warning)]/20",
  error: "bg-[var(--color-error-light)] text-[var(--color-error)] border-[var(--color-error)]/20",
  info: "bg-[var(--color-info-light)] text-[var(--color-info)] border-[var(--color-info)]/20",
};

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
