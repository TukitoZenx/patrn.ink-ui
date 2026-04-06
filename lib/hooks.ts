/* ═══════════════════════════════════════════════════════
   Custom React Hooks
   Manages data fetching, auth state, and UI helpers
   ═══════════════════════════════════════════════════════ */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getLinks,
  getLinkDetails,
  getAnalytics,
  getAPITokens,
  type User,
  type PaginatedLinks,
  type Link,
  type LinksQuery,
  type AnalyticsSummary,
  type AnalyticsQuery,
  type APIToken,
  type ApiError,
} from "./api";
import { removeToken, isAuthenticated } from "./auth";

// ─── Generic async data hook ─────────────────────────────

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: { enabled?: boolean } = {}
): UseAsyncState<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "An error occurred");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Auth Hook ───────────────────────────────────────────

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const hasSession = typeof window !== "undefined" && isAuthenticated();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSession);

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    let cancelled = false;

    getCurrentUser()
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        removeToken();
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setLoading(false);
    router.push("/");
  }, [router]);

  return {
    user,
    loading,
    authenticated: !!user,
    logout,
  };
}

// ─── Links Hook ──────────────────────────────────────────

export function useLinks(query: LinksQuery = {}) {
  return useAsync<PaginatedLinks>(
    () => getLinks(query),
    [JSON.stringify(query)]
  );
}

// ─── Single Link Hook ────────────────────────────────────

export function useLinkDetails(code: string) {
  return useAsync<Link>(() => getLinkDetails(code), [code], {
    enabled: !!code,
  });
}

// ─── Analytics Hook ──────────────────────────────────────

export function useAnalytics(code: string, query: AnalyticsQuery = {}) {
  return useAsync<AnalyticsSummary>(
    () => getAnalytics(code, query),
    [code, JSON.stringify(query)],
    { enabled: !!code }
  );
}

// ─── API Tokens Hook ─────────────────────────────────────

export function useTokens() {
  const result = useAsync<{ tokens: APIToken[] }>(() => getAPITokens(), []);
  return {
    tokens: result.data?.tokens || [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Debounce Hook ───────────────────────────────────────

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── Clipboard Hook ──────────────────────────────────────

export function useClipboard(resetAfter: number = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetAfter);
      } catch {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), resetAfter);
      }
    },
    [resetAfter]
  );

  return { copied, copy };
}
