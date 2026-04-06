"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function BrandMark({
  size = 44,
  className,
  priority = false,
}: BrandMarkProps) {
  return (
    <Image
      src="/patrn.ink-transparent_512.png"
      alt="patrn.ink"
      width={size}
      height={size}
      priority={priority}
      className={cn("h-auto w-auto shrink-0 object-contain", className)}
    />
  );
}
