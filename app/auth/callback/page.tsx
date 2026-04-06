"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import { BrandMark } from "@/components/ui/BrandMark";
import { setToken } from "@/lib/auth";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const hasToken = !!token && !error;
  const errorMsg = error || "No authentication token received";

  useEffect(() => {
    if (!hasToken || !token) {
      return;
    }

    setToken(token);
    const timeout = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [hasToken, router, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="flex flex-col items-center gap-5 text-center px-6">
        {/* Logo */}
        <BrandMark size={56} priority />

        {hasToken ? (
          <>
            <CheckCircle size={40} className="text-[var(--color-success)]" />
            <div>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                Welcome back!
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Redirecting to your dashboard...
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle size={40} className="text-[var(--color-error)]" />
            <div>
              <p className="text-lg font-semibold text-[var(--color-text)]">
                Authentication Failed
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                {errorMsg}
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 text-sm text-[var(--color-primary)] hover:underline cursor-pointer"
              >
                Return to home page
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
