"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap font-medium cursor-pointer
      transition-all duration-200 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed
      focus-visible:outline-2 focus-visible:outline-offset-2
    `;

    const variants: Record<string, string> = {
      primary: `
        bg-[var(--color-primary)] text-white
        hover:bg-[var(--color-primary-hover)]
        focus-visible:outline-[var(--color-primary)]
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-[var(--color-primary-light)] text-[var(--color-primary)]
        hover:bg-[var(--color-primary-200)]
        focus-visible:outline-[var(--color-primary)]
      `,
      ghost: `
        bg-transparent text-[var(--color-text-secondary)]
        hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]
      `,
      danger: `
        bg-[var(--color-error)] text-white
        hover:bg-red-600
        focus-visible:outline-[var(--color-error)]
      `,
      outline: `
        bg-transparent text-[var(--color-text)]
        border border-[var(--color-border)]
        hover:bg-[var(--color-surface-hover)]
        hover:border-[var(--color-border-focus)]
      `,
    };

    const sizes: Record<string, string> = {
      sm: "h-8 px-3 text-xs rounded-lg",
      md: "h-10 px-4 text-sm rounded-xl",
      lg: "h-12 px-6 text-base rounded-xl",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps };
