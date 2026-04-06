"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, children, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              `dropdown-base w-full appearance-none rounded-xl border border-[var(--color-border)]
              bg-[var(--color-surface)] px-3 pr-10 text-sm text-[var(--color-text)]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]
              transition-[border-color,background-color,box-shadow,transform] duration-200
              hover:border-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]
              focus:border-[var(--color-border-focus)] focus:bg-[var(--color-surface)]
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15
              disabled:cursor-not-allowed disabled:opacity-50`,
              error &&
                "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20",
              className,
            )}
            {...props}
          >
            {children}
          </select>

          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--color-text-tertiary)]">
            <ChevronDown size={16} />
          </span>
        </div>

        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-[var(--color-text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
