"use client";

import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "./ThemeProvider";

function ThemedToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      closeButton
      expand
      richColors
      position="top-right"
      theme={theme}
      toastOptions={{
        style: {
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text)",
        },
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
