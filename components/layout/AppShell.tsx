"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BrandMark } from "@/components/ui/BrandMark";
import { useAuth } from "@/lib/hooks";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading, authenticated, logout } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/");
    }
  }, [loading, authenticated, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4">
          <BrandMark size={48} priority className="animate-pulse" />
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Don't render shell if not authenticated (will redirect)
  if (!authenticated) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)]">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header
        user={user}
        onLogout={logout}
        sidebarCollapsed={sidebarCollapsed}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* Main content area */}
      <main
        className={cn(
          "min-h-screen pt-[var(--header-height)] transition-[padding] duration-200 ease-out",
          sidebarCollapsed
            ? "lg:pl-[var(--sidebar-collapsed-width)]"
            : "lg:pl-[var(--sidebar-width)]",
        )}
      >
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
