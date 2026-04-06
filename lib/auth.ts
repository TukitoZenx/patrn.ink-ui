/* ═══════════════════════════════════════════════════════
   Authentication Utilities
   Manages JWT token lifecycle in localStorage
   ═══════════════════════════════════════════════════════ */

const TOKEN_KEY = "patrn-jwt";

/** Store JWT token */
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/** Retrieve JWT token */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/** Remove JWT token (logout) */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/** Check if the user has a stored token */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Basic expiry check by decoding JWT payload
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiry = payload.exp * 1000; // JWT exp is in seconds
    return Date.now() < expiry;
  } catch {
    return false;
  }
}

/** Get the API login URL for a given provider */
export function getLoginUrl(provider: "google" | "github"): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return `${apiUrl}/auth/${provider}/login`;
}
