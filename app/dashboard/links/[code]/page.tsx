"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Archive,
  CalendarClock,
  Check,
  Copy,
  ExternalLink,
  Edit3,
  BarChart3,
  Clock,
  Link2,
  Lock,
  QrCode,
  RefreshCw,
  Save,
  Shield,
  Tag,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { HealthBadge } from "@/components/links/HealthBadge";
import { RotationTargetsEditor } from "@/components/links/RotationTargetsEditor";
import { useLinkDetails, useAnalytics, useClipboard } from "@/lib/hooks";
import {
  deleteLink,
  getLinkPreviewByCode,
  getQRCodeUrl,
  refreshLinkHealth,
  updateLink,
  type Link,
  type UpdateLinkRequest,
  type LinkPreview,
  type RotationTargetInput,
} from "@/lib/api";
import {
  abbreviateNumber,
  AGE_LABELS,
  formatDate,
  formatDateTime,
  getRotationTargetsError,
  isValidUrl,
  normalizeRotationTargets,
  truncate,
} from "@/lib/utils";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function LinkDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const { data: link, loading, error: linkError } = useLinkDetails(code);
  const { data: analytics, error: analyticsError } = useAnalytics(code);
  const { copy } = useClipboard();

  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [refreshingHealth, setRefreshingHealth] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const shortUrl = `${apiUrl}/${code}`;

  useEffect(() => {
    if (link) {
      setCurrentLink(link);
    }
  }, [link]);

  const activeLink = currentLink ?? link ?? null;

  useEffect(() => {
    let cancelled = false;
    getLinkPreviewByCode(code)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, activeLink?.long_url]);

  useEffect(() => {
    if (
      !activeLink ||
      activeLink.health_status?.last_checked_at ||
      refreshingHealth
    ) {
      return;
    }

    void handleRefreshHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLink?.short_code, activeLink?.health_status?.last_checked_at]);

  const handleCopy = async () => {
    await copy(shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete /${code}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteLink(code);
      toast.success("Link deleted");
      router.push("/dashboard/links");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!activeLink) return;
    setArchiving(true);
    try {
      const updatedLink = await updateLink(code, {
        is_archived: !activeLink.is_archived,
      });
      setCurrentLink(updatedLink);
      toast.success(activeLink.is_archived ? "Link restored" : "Link archived");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update archive state");
    } finally {
      setArchiving(false);
    }
  };

  const handleRefreshHealth = async () => {
    setRefreshingHealth(true);
    try {
      const refreshedLink = await refreshLinkHealth(code);
      setCurrentLink(refreshedLink);
      toast.success("Destination health refreshed");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to refresh health");
    } finally {
      setRefreshingHealth(false);
    }
  };

  if (loading && !activeLink) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width="30%" height={28} />
        <Skeleton
          variant="rect"
          width="100%"
          height={200}
          className="rounded-xl"
        />
        <Skeleton
          variant="rect"
          width="100%"
          height={300}
          className="rounded-xl"
        />
      </div>
    );
  }

  if (!activeLink) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-text-secondary)]">
          {linkError || "Link not found"}
        </p>
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/links")}
          className="mt-4"
        >
          Back to Links
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/links")}
        icon={<ArrowLeft size={16} />}
      >
        Back to Links
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card padding="lg">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-primary)]">
                  /{code}
                </h1>
                {activeLink.custom_alias && (
                  <Badge variant="primary">Custom</Badge>
                )}
                {activeLink.is_archived && (
                  <Badge variant="warning">Archived</Badge>
                )}
                {!activeLink.is_active && (
                  <Badge variant="error">Inactive</Badge>
                )}
                {activeLink.password && (
                  <Badge variant="info">Password gate</Badge>
                )}
                {activeLink.age_verification > 0 && (
                  <Badge variant="error">
                    {AGE_LABELS[activeLink.age_verification]}
                  </Badge>
                )}
                {!!activeLink.rotation_targets?.length && (
                  <Badge variant="info">
                    Rotates across {activeLink.rotation_targets.length + 1}
                  </Badge>
                )}
                <HealthBadge status={activeLink.health_status?.status} />
              </div>
              <p className="mt-2 text-lg text-[var(--color-text)]">
                {activeLink.title || "Untitled link"}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Detailed management view for destination, metadata, QR, and
                analytics.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(shortUrl, "_blank", "noopener,noreferrer")
                }
                icon={<ExternalLink size={14} />}
              >
                Open link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    activeLink.long_url,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                icon={<ExternalLink size={14} />}
              >
                Open target
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshHealth}
                loading={refreshingHealth}
                icon={<RefreshCw size={14} />}
              >
                Run health check
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                icon={<Edit3 size={14} />}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                loading={archiving}
                onClick={handleArchiveToggle}
                icon={
                  activeLink.is_archived ? (
                    <RefreshCw size={14} />
                  ) : (
                    <Archive size={14} />
                  )
                }
              >
                {activeLink.is_archived ? "Restore" : "Archive"}
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
                icon={<Trash2 size={14} />}
              >
                Delete
              </Button>
            </div>
          </div>

          {preview && (
            <div className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/65 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                Destination preview
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-text)]">
                {preview.title || preview.domain}
              </p>
              {preview.description && (
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {preview.description}
                </p>
              )}
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {preview.domain}
              </p>
            </div>
          )}

          <div className="mb-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                  Destination health
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <HealthBadge status={activeLink.health_status?.status} />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {activeLink.health_status?.healthy_destinations || 0}{" "}
                    healthy /{" "}
                    {activeLink.health_status?.total_destinations || 1} active
                    destination(s)
                  </span>
                </div>
                {activeLink.health_status?.needs_attention && (
                  <p className="mt-2 text-sm text-[var(--color-warning)]">
                    One or more active destinations are returning a failing
                    response. Rotation will prefer non-broken destinations when
                    possible.
                  </p>
                )}
                {activeLink.health_status?.last_checked_at && (
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                    Last checked{" "}
                    {formatDateTime(activeLink.health_status.last_checked_at)}
                  </p>
                )}
              </div>
              {!!activeLink.rotation_targets?.length && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                    Rotation mode
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                    Round robin
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Requests rotate across the primary URL and{" "}
                    {activeLink.rotation_targets.length} alternate target(s).
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                Destination
              </p>
              <a
                href={activeLink.long_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                {truncate(activeLink.long_url, 40)} <ExternalLink size={12} />
              </a>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                Created
              </p>
              <p className="text-sm text-[var(--color-text)]">
                {formatDateTime(activeLink.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                Clicks
              </p>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {abbreviateNumber(activeLink.clicks)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                Public URL
              </p>
              <p className="text-sm text-[var(--color-text)]">{shortUrl}</p>
            </div>
            {activeLink.expires_at && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock size={12} /> Expires
                </p>
                <p className="text-sm text-[var(--color-text)]">
                  {formatDate(activeLink.expires_at)}
                </p>
              </div>
            )}
            {activeLink.scheduled_at && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CalendarClock size={12} /> Scheduled
                </p>
                <p className="text-sm text-[var(--color-text)]">
                  {formatDateTime(activeLink.scheduled_at)}
                </p>
              </div>
            )}
            {activeLink.password && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Lock size={12} /> Protected
                </p>
                <Badge variant="warning">Password Required</Badge>
              </div>
            )}
            {activeLink.age_verification > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Shield size={12} /> Age Gate
                </p>
                <Badge variant="error">
                  {AGE_LABELS[activeLink.age_verification]}
                </Badge>
              </div>
            )}
            {activeLink.tags && activeLink.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Tag size={12} /> Tags
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {activeLink.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {activeLink.description && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
                Description
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {activeLink.description}
              </p>
            </div>
          )}

          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Destinations
            </p>
            <div className="mt-3 space-y-3">
              <DestinationRow
                title="Primary destination"
                url={activeLink.long_url}
                status={activeLink.primary_health?.status}
                checkedAt={activeLink.primary_health?.last_checked_at}
                statusCode={activeLink.primary_health?.status_code}
                error={activeLink.primary_health?.last_error}
              />
              {activeLink.rotation_targets?.map((target, index) => (
                <DestinationRow
                  key={`${target.url}-${index}`}
                  title={target.label || `Rotation target ${index + 1}`}
                  url={target.url}
                  status={target.status}
                  checkedAt={target.last_checked_at}
                  statusCode={target.status_code}
                  error={target.last_error}
                  inactive={!target.is_active}
                />
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="lg">
          <h3 className="text-base font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <QrCode size={18} /> QR Code
          </h3>
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 rounded-xl bg-white p-3 border border-[var(--color-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getQRCodeUrl(code)}
                alt={`QR code for /${code}`}
                className="w-full h-full object-contain"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(getQRCodeUrl(code), "_blank", "noopener,noreferrer")
              }
            >
              Download QR Code
            </Button>
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)] flex items-center gap-2">
                <BarChart3 size={18} /> Click Timeline
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {analyticsError ||
                  "Recent performance from the analytics endpoint."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/analytics?code=${code}`)}
            >
              View detailed analytics
            </Button>
          </div>
          {analytics && analytics.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.timeline}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => d.slice(5)}
                  tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-tertiary)]">
              No click data available yet
            </div>
          )}
        </Card>
      </div>

      {analytics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              Total clicks
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
              {abbreviateNumber(analytics.total_clicks)}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              Unique clicks
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
              {abbreviateNumber(analytics.unique_clicks)}
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              Countries seen
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
              {Object.keys(analytics.countries || {}).length}
            </p>
          </Card>
        </div>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit link"
        description="Update the primary destination, rotation targets, metadata, scheduling, expiration, archive state, and password."
        size="lg"
      >
        <EditLinkModalContent
          link={activeLink}
          onCancel={() => setEditOpen(false)}
          onSave={async (payload) => {
            const updatedLink = await updateLink(code, payload);
            setCurrentLink(updatedLink);
            setEditOpen(false);
            toast.success("Link updated!");
          }}
        />
      </Modal>
    </div>
  );
}

function EditLinkModalContent({
  link,
  onCancel,
  onSave,
}: {
  link: Link;
  onCancel: () => void;
  onSave: (payload: UpdateLinkRequest) => Promise<void>;
}) {
  const [form, setForm] = useState({
    long_url: link.long_url,
    title: link.title || "",
    description: link.description || "",
    tags: link.tags?.join(", ") || "",
    expires_in: "",
    scheduled_at: link.scheduled_at ? link.scheduled_at.slice(0, 16) : "",
    password: "",
    rotation_targets: toRotationTargetInputs(link.rotation_targets),
  });
  const [saving, setSaving] = useState(false);
  const normalizedRotationTargets = normalizeRotationTargets(
    form.rotation_targets,
  );
  const rotationTargetsError = getRotationTargetsError(
    form.long_url,
    normalizedRotationTargets,
  );

  useEffect(() => {
    setForm({
      long_url: link.long_url,
      title: link.title || "",
      description: link.description || "",
      tags: link.tags?.join(", ") || "",
      expires_in: "",
      scheduled_at: link.scheduled_at ? link.scheduled_at.slice(0, 16) : "",
      password: "",
      rotation_targets: toRotationTargetInputs(link.rotation_targets),
    });
  }, [link]);

  const handleSave = async () => {
    if (!isValidUrl(form.long_url)) {
      toast.error("Enter a valid destination URL.");
      return;
    }
    if (rotationTargetsError) {
      toast.error(rotationTargetsError);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        long_url: form.long_url || undefined,
        title: form.title || undefined,
        description: form.description || undefined,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : undefined,
        expires_in: Number(form.expires_in) || undefined,
        scheduled_at: form.scheduled_at
          ? new Date(form.scheduled_at).toISOString()
          : undefined,
        password: form.password || undefined,
        rotation_targets: normalizedRotationTargets,
      });
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        label="Destination URL"
        value={form.long_url}
        onChange={(e) =>
          setForm((current) => ({ ...current, long_url: e.target.value }))
        }
        icon={<Link2 size={16} />}
        error={
          form.long_url && !isValidUrl(form.long_url)
            ? "Enter a valid URL"
            : undefined
        }
      />
      <Input
        label="Title"
        value={form.title}
        onChange={(e) =>
          setForm((current) => ({ ...current, title: e.target.value }))
        }
      />
      <Textarea
        label="Description"
        value={form.description}
        onChange={(e) =>
          setForm((current) => ({ ...current, description: e.target.value }))
        }
      />
      <Input
        label="Tags (comma separated)"
        value={form.tags}
        onChange={(e) =>
          setForm((current) => ({ ...current, tags: e.target.value }))
        }
      />
      <RotationTargetsEditor
        targets={form.rotation_targets}
        onChange={(rotationTargets) =>
          setForm((current) => ({
            ...current,
            rotation_targets: rotationTargets,
          }))
        }
      />
      {rotationTargetsError && (
        <p className="text-sm text-[var(--color-error)]">
          {rotationTargetsError}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Reset expiration (hours from now)"
          type="number"
          value={form.expires_in}
          onChange={(e) =>
            setForm((current) => ({ ...current, expires_in: e.target.value }))
          }
          hint="Leave empty to keep the current expiration."
        />
        <Input
          label="Scheduled activation"
          type="datetime-local"
          value={form.scheduled_at}
          onChange={(e) =>
            setForm((current) => ({ ...current, scheduled_at: e.target.value }))
          }
          hint="Leave empty to keep the current schedule."
        />
      </div>
      <Input
        label="Replace password"
        type="password"
        value={form.password}
        onChange={(e) =>
          setForm((current) => ({ ...current, password: e.target.value }))
        }
        hint="The current backend contract supports replacing the password, not clearing it."
      />
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4 text-sm text-[var(--color-text-secondary)]">
        Age verification is currently read-only in the edit flow because the
        update endpoint does not accept that field.
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} icon={<Save size={16} />}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function DestinationRow({
  title,
  url,
  status,
  checkedAt,
  statusCode,
  error,
  inactive = false,
}: {
  title: string;
  url: string;
  status?: string;
  checkedAt?: string;
  statusCode?: number;
  error?: string;
  inactive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/65 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {title}
            </p>
            <HealthBadge status={status} />
            {inactive && <Badge variant="default">Inactive</Badge>}
            {statusCode ? (
              <Badge variant="default">HTTP {statusCode}</Badge>
            ) : null}
          </div>
          <p className="mt-2 break-all text-sm text-[var(--color-text-secondary)]">
            {url}
          </p>
          {error && (
            <p className="mt-2 text-sm text-[var(--color-warning)]">{error}</p>
          )}
        </div>
        {checkedAt && (
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Checked {formatDateTime(checkedAt)}
          </p>
        )}
      </div>
    </div>
  );
}

function toRotationTargetInputs(
  targets: Link["rotation_targets"] = [],
): RotationTargetInput[] {
  return (targets || []).map((target) => ({
    url: target.url,
    label: target.label,
    is_active: target.is_active,
  }));
}
