"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  children,
  className,
  hover = false,
  onClick,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        `rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]
        transition-all duration-200`,
        hover && "hover:shadow-md hover:border-[var(--color-border-focus)]/30 cursor-pointer",
        onClick && "cursor-pointer",
        paddingStyles[padding],
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
