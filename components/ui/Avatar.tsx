"use client";

import Image from "next/image";
import { useState } from "react";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap: Record<string, { px: number; text: string }> = {
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 48, text: "text-base" },
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { px, text } = sizeMap[size];
  const [showFallback, setShowFallback] = useState(false);

  if (src && !showFallback) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        onError={() => setShowFallback(true)}
        className={cn(
          "rounded-full object-cover border border-[var(--color-border)]",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        `rounded-full flex items-center justify-center font-semibold
        bg-[var(--color-primary-light)] text-[var(--color-primary)]
        border border-[var(--color-primary)]/20`,
        text,
        className
      )}
      style={{ width: px, height: px }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
