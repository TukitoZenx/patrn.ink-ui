/* ═══════════════════════════════════════════════════════
   patrn.ink API Client
   Central fetch wrapper with JWT injection, error handling,
   retry logic, and typed functions for every endpoint.
   ═══════════════════════════════════════════════════════ */

import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ─── Types matching API models ───────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  provider: string;
  created_at: string;
}

export interface Link {
  short_code: string;
  long_url: string;
  user_id: string;
  custom_alias: boolean;
  clicks: number;
  created_at: string;
  expires_at?: string;
  scheduled_at?: string;
  is_active: boolean;
  tags?: string[];
  password?: string;
  is_archived: boolean;
  title?: string;
  description?: string;
  age_verification: number;
  rotation_targets?: RotationTarget[];
  primary_health?: DestinationCheck;
  health_status?: LinkHealthStatus;
}

export interface RotationTarget {
  url: string;
  label?: string;
  is_active: boolean;
  status?: string;
  status_code?: number;
  last_checked_at?: string;
  last_error?: string;
}

export interface RotationTargetInput {
  url: string;
  label?: string;
  is_active?: boolean;
}

export interface DestinationCheck {
  status?: string;
  status_code?: number;
  last_checked_at?: string;
  last_error?: string;
}

export interface LinkHealthStatus {
  status?: string;
  last_checked_at?: string;
  healthy_destinations?: number;
  failing_destinations?: number;
  total_destinations?: number;
  needs_attention?: boolean;
}

export interface CreateLinkRequest {
  long_url: string;
  custom_code?: string;
  expires_in?: number;
  scheduled_at?: string;
  tags?: string[];
  password?: string;
  title?: string;
  description?: string;
  age_verification?: number;
  rotation_targets?: RotationTargetInput[];
}

export interface CreateLinkResponse {
  short_url: string;
  short_code: string;
  long_url: string;
  qr_code_url: string;
  expires_at?: string;
  scheduled_at?: string;
  tags?: string[];
}

export interface UpdateLinkRequest {
  long_url?: string;
  expires_in?: number;
  scheduled_at?: string;
  tags?: string[];
  password?: string;
  title?: string;
  description?: string;
  is_archived?: boolean;
  rotation_targets?: RotationTargetInput[];
}

export interface PaginatedLinks {
  links: Link[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface LinksQuery {
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: string;
  archived?: boolean;
}

export interface AnalyticsSummary {
  total_clicks: number;
  unique_clicks: number;
  top_referrers: Record<string, number>;
  clicks_by_date: Record<string, number>;
  clicks_by_hour: Record<string, number>;
  device_types: Record<string, number>;
  browser_types: Record<string, number>;
  countries: Record<string, number>;
  timeline: { date: string; clicks: number }[];
}

export interface AnalyticsQuery {
  start_date?: string;
  end_date?: string;
}

export interface APIToken {
  id: string;
  user_id: string;
  name: string;
  token_prefix: string;
  scopes: string[];
  rate_limit: number;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  is_active: boolean;
}

export interface CreateAPITokenRequest {
  name: string;
  scopes: string[];
  expires_in?: number;
}

export interface CreateAPITokenResponse {
  token: string;
  api_token: APIToken;
}

export interface BulkDeleteRequest {
  codes: string[];
  archive: boolean;
}

export interface BulkDeleteResponse {
  deleted: string[];
  failed?: Record<string, string>;
}

export interface BulkImportItem {
  long_url: string;
  custom_code?: string;
  tags?: string[];
  title?: string;
}

export interface BulkImportResponse {
  created: CreateLinkResponse[];
  failed?: { index: number; url: string; reason: string }[];
}

export interface LinkPreview {
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  url: string;
  domain: string;
}

export interface PublicGateResponse {
  redirect_url?: string;
  error?: string;
  password_required?: boolean;
  age_required?: string;
  age_level?: number;
  verify_url?: string;
  title?: string;
  description?: string;
  gate_sequence?: string[];
}

// ─── API Error ───────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(
    status: number,
    message: string,
    data: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ─── Core Fetch Wrapper ──────────────────────────────────

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

function getAuthHeaders(
  extraHeaders: Record<string, string> = {},
): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const { timeout = 15000, retries = 1, ...fetchOpts } = options;
  const headers = getAuthHeaders(fetchOpts.headers as Record<string, string>);

  // Remove Content-Type for FormData uploads
  if (fetchOpts.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOpts,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.error || `Request failed with status ${response.status}`,
          errorData,
        );
      }

      // Handle empty responses (204 No Content or empty body)
      const text = await response.text();
      if (!text) return {} as T;

      return JSON.parse(text) as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on auth errors or client errors
      if (error instanceof ApiError && error.status < 500) {
        throw error;
      }

      // Only retry on network/server errors
      if (attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 500),
        );
      }
    }
  }

  throw lastError || new Error("Request failed");
}

async function downloadFile(
  endpoint: string,
  fallbackFilename: string,
): Promise<void> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: getAuthHeaders({ Accept: "*/*" }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `Request failed with status ${response.status}`,
      errorData,
    );
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackFilename;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Auth Endpoints ──────────────────────────────────────

export function getGoogleLoginUrl(): string {
  return `${API_URL}/auth/google/login`;
}

export function getGitHubLoginUrl(): string {
  return `${API_URL}/auth/github/login`;
}

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/api/me");
}

// ─── Link Endpoints ──────────────────────────────────────

export async function createLink(
  data: CreateLinkRequest,
): Promise<CreateLinkResponse> {
  return apiFetch<CreateLinkResponse>("/api/shorten", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getLinks(
  query: LinksQuery = {},
): Promise<PaginatedLinks> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.tags?.length) query.tags.forEach((t) => params.append("tags", t));
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sort_by) params.set("sort_by", query.sort_by);
  if (query.sort_order) params.set("sort_order", query.sort_order);
  if (query.archived !== undefined)
    params.set("archived", String(query.archived));

  const qs = params.toString();
  return apiFetch<PaginatedLinks>(`/api/links${qs ? `?${qs}` : ""}`);
}

export async function getLinkDetails(code: string): Promise<Link> {
  return apiFetch<Link>(`/api/links/${code}`);
}

export async function refreshLinkHealth(code: string): Promise<Link> {
  return apiFetch<Link>(`/api/links/${code}/health-check`, {
    method: "POST",
  });
}

export async function updateLink(
  code: string,
  data: UpdateLinkRequest,
): Promise<Link> {
  return apiFetch<Link>(`/api/links/${code}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLink(code: string): Promise<void> {
  await apiFetch(`/api/links/${code}`, { method: "DELETE" });
}

// ─── Analytics Endpoints ─────────────────────────────────

export async function getAnalytics(
  code: string,
  query: AnalyticsQuery = {},
): Promise<AnalyticsSummary> {
  const params = new URLSearchParams();
  if (query.start_date) params.set("start_date", query.start_date);
  if (query.end_date) params.set("end_date", query.end_date);

  const qs = params.toString();
  return apiFetch<AnalyticsSummary>(
    `/api/analytics/${code}${qs ? `?${qs}` : ""}`,
  );
}

export function getAnalyticsExportUrl(
  code: string,
  format: "csv" | "json" = "csv",
  startDate?: string,
  endDate?: string,
): string {
  const params = new URLSearchParams({ format });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  return `${API_URL}/api/analytics/${code}/export?${params.toString()}`;
}

export async function downloadAnalyticsExport(
  code: string,
  format: "csv" | "json" = "csv",
  startDate?: string,
  endDate?: string,
): Promise<void> {
  const params = new URLSearchParams({ format });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  await downloadFile(
    `/api/analytics/${code}/export?${params.toString()}`,
    `analytics-${code}.${format}`,
  );
}

// ─── Bulk Endpoints ──────────────────────────────────────

export async function bulkDelete(
  data: BulkDeleteRequest,
): Promise<BulkDeleteResponse> {
  return apiFetch<BulkDeleteResponse>("/api/bulk/delete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function bulkImport(
  links: BulkImportItem[],
): Promise<BulkImportResponse> {
  return apiFetch<BulkImportResponse>("/api/bulk/import", {
    method: "POST",
    body: JSON.stringify({ links }),
  });
}

export function getExportLinksUrl(format: "csv" | "json" = "csv"): string {
  return `${API_URL}/api/export/links?format=${format}`;
}

export async function downloadLinksExport(
  format: "csv" | "json" = "csv",
): Promise<void> {
  await downloadFile(
    `/api/export/links?format=${format}`,
    `links-export.${format}`,
  );
}

// ─── API Token Endpoints ─────────────────────────────────

export async function createAPIToken(
  data: CreateAPITokenRequest,
): Promise<CreateAPITokenResponse> {
  return apiFetch<CreateAPITokenResponse>("/api/tokens", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAPITokens(): Promise<{ tokens: APIToken[] }> {
  return apiFetch<{ tokens: APIToken[] }>("/api/tokens");
}

export async function revokeAPIToken(id: string): Promise<void> {
  await apiFetch(`/api/tokens/${id}`, { method: "DELETE" });
}

export async function updateAPITokenRateLimit(
  id: string,
  rateLimit: number,
): Promise<void> {
  await apiFetch(`/api/tokens/${id}/rate-limit`, {
    method: "PUT",
    body: JSON.stringify({ rate_limit: rateLimit }),
  });
}

// ─── Public Endpoints ────────────────────────────────────

export async function verifyLinkPassword(
  code: string,
  password: string,
): Promise<PublicGateResponse> {
  return apiFetch<PublicGateResponse>(`/${code}/verify`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ password }),
  });
}

export async function verifyAge(
  code: string,
  confirmed: boolean,
  ageLevel: number,
): Promise<PublicGateResponse> {
  return apiFetch<PublicGateResponse>(`/${code}/verify-age`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ confirmed, age_level: ageLevel }),
  });
}

export async function getLinkPreview(url: string): Promise<LinkPreview> {
  return apiFetch<LinkPreview>(`/api/preview?url=${encodeURIComponent(url)}`);
}

export async function getLinkPreviewByCode(code: string): Promise<LinkPreview> {
  return apiFetch<LinkPreview>(`/${code}/preview`);
}

export function getQRCodeUrl(code: string): string {
  return `${API_URL}/${code}/qr`;
}
