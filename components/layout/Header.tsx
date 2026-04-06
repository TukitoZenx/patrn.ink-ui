"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/Toggle";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/lib/api";

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  sidebarCollapsed: boolean;
  onOpenSidebar: () => void;
}

export function Header({ user, onLogout, sidebarCollapsed, onOpenSidebar }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={cn(
        `fixed top-0 right-0 z-30
        h-[var(--header-height)] flex items-center justify-between px-6
        bg-[var(--color-surface)]/80 backdrop-blur-md
        border-b border-[var(--color-border)]
        transition-[left] duration-200 ease-out`,
        sidebarCollapsed
          ? "left-0 lg:left-[var(--sidebar-collapsed-width)]"
          : "left-0 lg:left-[var(--sidebar-width)]"
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <div className="hidden lg:block" />
      </div>

      {/* Right side — Actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User dropdown */}
        {user && (
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            >
              <Avatar
                src={user.picture}
                name={user.name}
                size="sm"
              />
              <span className="text-sm font-medium text-[var(--color-text)] hidden sm:block max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  "text-[var(--color-text-tertiary)] transition-transform",
                  dropdownOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-52 py-1.5
                  bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]
                  shadow-lg z-50"
              >
                <div className="px-3 py-2 border-b border-[var(--color-border)]">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                    {user.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm
                    text-[var(--color-error)] hover:bg-[var(--color-error-light)]
                    transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
