"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Key,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/links", label: "Links", icon: Link2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/tokens", label: "API Tokens", icon: Key },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggle: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const showLabels = !collapsed || mobileOpen;

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-30 bg-black/35 lg:hidden"
            aria-label="Close navigation"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          `fixed top-0 left-0 z-40 flex h-full flex-col overflow-x-hidden border-r border-[var(--color-border)]
          bg-[var(--color-surface)] transition-[width,transform] duration-200 ease-out will-change-transform`,
          collapsed
            ? "lg:w-[var(--sidebar-collapsed-width)]"
            : "lg:w-[var(--sidebar-width)]",
          "w-[var(--sidebar-width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex h-[var(--header-height)] items-center justify-between border-b border-[var(--color-border)] px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <BrandMark size={34} priority />
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap text-lg font-bold text-[var(--color-text)] transition-[max-width,opacity,transform] duration-200 ease-out",
                showLabels
                  ? "max-w-[10rem] opacity-100 translate-x-0"
                  : "max-w-0 opacity-0 -translate-x-1",
              )}
            >
              patrn.ink
            </span>
          </Link>

          <button
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-[var(--color-text-secondary)] lg:hidden"
            aria-label="Close navigation"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!showLabels ? item.label : undefined}
                onClick={onCloseMobile}
                className={cn(
                  `group relative flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                  transition-colors duration-150`,
                  isActive
                    ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-primary)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <item.icon size={20} className="flex-shrink-0" />

                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-out",
                    showLabels
                      ? "max-w-[10rem] opacity-100 translate-x-0"
                      : "max-w-0 opacity-0 -translate-x-1",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-[var(--color-border)] p-3 lg:block">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm
            text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-surface-hover)]
            hover:text-[var(--color-text)]"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.18 }}
            >
              <ChevronLeft size={18} />
            </motion.div>
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-out",
                collapsed
                  ? "max-w-0 opacity-0 -translate-x-1"
                  : "max-w-[6rem] opacity-100 translate-x-0",
              )}
            >
              Collapse
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
