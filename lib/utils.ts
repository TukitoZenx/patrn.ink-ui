/* ═══════════════════════════════════════════════════════
   Utility Functions
   Formatting, class merging, and data helpers
   ═══════════════════════════════════════════════════════ */

import { clsx, type ClassValue } from "clsx";
import type { RotationTargetInput } from "./api";

/** Merge class names conditionally (Tailwind-safe) */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Abbreviate large numbers: 1234 → "1.2K", 1500000 → "1.5M" */
export function abbreviateNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 1_000_000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (num < 1_000_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
}

/** Format a date string to human-readable: "Mar 24, 2026" */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Format a date string with time: "Mar 24, 2026 at 5:24 PM" */
export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/** Relative time: "2 hours ago", "3 days ago" */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Validate URL format */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Validate a custom short code according to the backend contract */
export function isValidCustomCode(code: string): boolean {
  return /^[A-Za-z0-9-]{3,20}$/.test(code);
}

/** Extract domain from URL: "https://example.com/path" → "example.com" */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Truncate string with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/** Copy text to clipboard and return success */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

/** Generate initials from a name: "John Doe" → "JD" */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Age verification label mapping */
export const AGE_LABELS: Record<number, string> = {
  0: "None",
  1: "13+",
  2: "18+",
  3: "21+",
};

/** Parse CSV text into row objects with quoted-field support */
export function parseCsvRows(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let currentValue = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentValue.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());

  return bodyRows.map((row) =>
    headers.reduce<Record<string, string>>((record, header, index) => {
      record[header] = row[index]?.trim() || "";
      return record;
    }, {}),
  );
}

export function normalizeRotationTargets(targets: RotationTargetInput[]) {
  return targets
    .map((target) => ({
      url: target.url.trim(),
      label: target.label?.trim() || undefined,
      is_active: target.is_active !== false,
    }))
    .filter((target) => target.url.length > 0);
}

export function getRotationTargetsError(
  primaryUrl: string,
  targets: RotationTargetInput[],
) {
  if (targets.length === 0) {
    return "";
  }

  const normalizedPrimary = primaryUrl.trim().toLowerCase();
  const seen = new Set<string>();

  for (const target of targets) {
    if (!isValidUrl(target.url)) {
      return "Every rotation target must be a valid URL.";
    }

    const key = target.url.trim().toLowerCase();
    if (normalizedPrimary && key === normalizedPrimary) {
      return "Rotation targets cannot duplicate the primary destination.";
    }
    if (seen.has(key)) {
      return "Rotation targets cannot contain duplicate URLs.";
    }
    seen.add(key);
  }

  return "";
}
