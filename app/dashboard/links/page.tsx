"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  SortAsc,
  SortDesc,
  Link2,
  Lock,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCardSkeleton } from "@/components/ui/Skeleton";
import { HealthBadge } from "@/components/links/HealthBadge";
import { RotationTargetsEditor } from "@/components/links/RotationTargetsEditor";
import { useLinks, useDebounce, useClipboard } from "@/lib/hooks";
import {
  bulkDelete,
  bulkImport,
  createLink,
  deleteLink,
  downloadLinksExport,
  getLinkPreview,
  updateLink,
  type BulkImportItem,
  type CreateLinkRequest,
  type LinkPreview,
} from "@/lib/api";
import {
  abbreviateNumber,
  parseCsvRows,
  timeAgo,
  truncate,
  isValidUrl,
  isValidCustomCode,
  AGE_LABELS,
  formatDateTime,
  normalizeRotationTargets,
  getRotationTargetsError,
} from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: "created_at", label: "Newest first" },
  { value: "clicks", label: "Most clicks" },
  { value: "expires_at", label: "Expiring soon" },
];

function PreviewCard({
  preview,
  onApply,
}: {
  preview: LinkPreview;
  onApply?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
            {preview.title || preview.domain}
          </p>
          {preview.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              {preview.description}
            </p>
          )}
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
            {preview.domain}
          </p>
        </div>
        {onApply && (
          <Button variant="outline" size="sm" onClick={onApply}>
            Use preview
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LinksPage() {
  const router = useRouter();
  const { copy } = useClipboard();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"archive" | "delete" | null>(
    null,
  );
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showArchived, setShowArchived] = useState(false);
  const debouncedSearch = useDebounce(search, 400);

  const { data, loading, error, refetch } = useLinks({
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
    sort_by: sortBy,
    sort_order: sortOrder,
    archived: showArchived,
  });

  const links = data?.links || [];
  const totalPages = data?.total_pages || 1;

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateLinkRequest>({
    long_url: "",
  });
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const selectedCount = selected.size;

  const [importOpen, setImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importRows, setImportRows] = useState<BulkImportItem[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const previewUrl = useDebounce(createForm.long_url, 500);
  const importSummary = useMemo(() => importRows.slice(0, 5), [importRows]);

  useEffect(() => {
    if (!previewUrl || !isValidUrl(previewUrl)) {
      setPreview(null);
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);

    getLinkPreview(previewUrl)
      .then((nextPreview) => {
        if (!cancelled) {
          setPreview(nextPreview);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreview(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [previewUrl]);

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    setCreateForm({ long_url: "", rotation_targets: [] });
    setPreview(null);
    setPreviewLoading(false);
  };

  const handleCreate = async () => {
    if (!createForm.long_url || !isValidUrl(createForm.long_url)) {
      toast.error("Please enter a valid URL");
      return;
    }
    if (createForm.custom_code && !isValidCustomCode(createForm.custom_code)) {
      toast.error("Custom code must be 3-20 letters, numbers, or hyphens");
      return;
    }
    if (rotationTargetsError) {
      toast.error(rotationTargetsError);
      return;
    }
    setCreating(true);
    try {
      await createLink({
        ...createForm,
        rotation_targets: normalizedRotationTargets,
      });
      toast.success("Link created!");
      closeCreateModal();
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to create link");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Delete /${code}? This action cannot be undone.`)) return;
    setBusyCode(code);
    setBusyAction("delete");
    try {
      await deleteLink(code);
      toast.success("Link deleted");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to delete");
    } finally {
      setBusyCode(null);
      setBusyAction(null);
    }
  };

  const handleArchiveToggle = async (code: string, archived: boolean) => {
    setBusyCode(code);
    setBusyAction("archive");
    try {
      await updateLink(code, { is_archived: !archived });
      toast.success(archived ? "Link restored" : "Link archived");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update archive state");
    } finally {
      setBusyCode(null);
      setBusyAction(null);
    }
  };

  const handleBulkAction = async (archive: boolean) => {
    if (selected.size === 0) return;
    if (
      !confirm(
        `Apply ${archive ? "archive" : "delete"} to ${selected.size} selected links?`,
      )
    ) {
      return;
    }
    setBulkLoading(true);
    try {
      const result = await bulkDelete({ codes: Array.from(selected), archive });
      const failedCount = Object.keys(result.failed || {}).length;
      if (failedCount > 0) {
        toast.warning(
          `${result.deleted.length} processed, ${failedCount} failed`,
        );
      } else {
        toast.success(
          `${result.deleted.length} links ${archive ? "archived" : "deleted"}`,
        );
      }
      setSelected(new Set());
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Bulk operation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCopy = async (code: string, url: string) => {
    await copy(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      await downloadLinksExport(format);
      toast.success(`Links exported as ${format.toUpperCase()}`);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to export links");
    }
  };

  const handleImportFile = async (file: File) => {
    setImportError(null);
    setImportFileName(file.name);
    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      const mappedRows = rows
        .map((row) => ({
          long_url: row.long_url,
          custom_code: row.custom_code || undefined,
          title: row.title || undefined,
          tags: row.tags
            ? row.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
            : undefined,
        }))
        .filter((row) => row.long_url);

      if (mappedRows.length === 0) {
        setImportRows([]);
        setImportError(
          "No valid rows found. Use headers: long_url, custom_code, title, tags.",
        );
        return;
      }

      const invalidRow = mappedRows.find(
        (row) =>
          !isValidUrl(row.long_url) ||
          (row.custom_code && !isValidCustomCode(row.custom_code)),
      );

      if (invalidRow) {
        setImportRows([]);
        setImportError(
          "Every row must include a valid long_url, and custom_code values must match backend rules.",
        );
        return;
      }

      setImportRows(mappedRows);
    } catch {
      setImportRows([]);
      setImportError("Unable to read the selected CSV file.");
    }
  };

  const submitImport = async () => {
    if (importRows.length === 0) {
      toast.error("Choose a CSV with at least one valid row");
      return;
    }
    setImporting(true);
    try {
      const result = await bulkImport(importRows);
      const failedCount = result.failed?.length || 0;
      if (failedCount > 0) {
        toast.warning(
          `${result.created.length} links imported, ${failedCount} failed`,
        );
      } else {
        toast.success(`${result.created.length} links imported`);
      }
      setImportOpen(false);
      setImportRows([]);
      setImportError(null);
      setImportFileName("");
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const toggleVisibleSelection = () => {
    const visibleCodes = links.map((link) => link.short_code);
    const allSelected = visibleCodes.every((code) => selected.has(code));

    setSelected((prev) => {
      const next = new Set(prev);
      visibleCodes.forEach((code) => {
        if (allSelected) next.delete(code);
        else next.add(code);
      });
      return next;
    });
  };

  const allVisibleSelected =
    links.length > 0 && links.every((link) => selected.has(link.short_code));
  const normalizedRotationTargets = normalizeRotationTargets(
    createForm.rotation_targets || [],
  );
  const rotationTargetsError = getRotationTargetsError(
    createForm.long_url,
    normalizedRotationTargets,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            Links
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Search, sort, archive, import, and export your links without leaving
            the dashboard.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={() => setImportOpen(true)}
            icon={<Upload size={16} />}
          >
            Import CSV
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={() => handleExport("csv")}
            icon={<Download size={16} />}
          >
            Export CSV
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={() => handleExport("json")}
            icon={<Download size={16} />}
          >
            Export JSON
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => setCreateOpen(true)}
            icon={<Plus size={16} />}
          >
            Create Link
          </Button>
        </div>
      </div>

      <Card padding="lg">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_repeat(3,minmax(0,0.45fr))]">
          <Input
            placeholder="Search by short code, title, or destination"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            icon={<Search size={16} />}
          />

          <div className="flex flex-col gap-1.5">
            <Select
              label="Sort field"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setPage(1);
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">
              Order
            </label>
            <Button
              variant="outline"
              className="justify-between"
              onClick={() => {
                setSortOrder((current) =>
                  current === "desc" ? "asc" : "desc",
                );
                setPage(1);
              }}
              icon={
                sortOrder === "desc" ? (
                  <SortDesc size={16} />
                ) : (
                  <SortAsc size={16} />
                )
              }
            >
              {sortOrder === "desc" ? "Descending" : "Ascending"}
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-text-secondary)]">
              View
            </label>
            <Button
              variant={showArchived ? "secondary" : "outline"}
              className="justify-between"
              onClick={() => {
                setShowArchived((current) => !current);
                setPage(1);
                setSelected(new Set());
              }}
              icon={
                showArchived ? <RefreshCw size={16} /> : <Archive size={16} />
              }
            >
              {showArchived ? "Archived only" : "Active only"}
            </Button>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-[var(--color-primary)]/20 bg-[var(--color-primary-light)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {selectedCount} selected
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Use bulk actions for the current filtered set.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleVisibleSelection}
                  >
                    {allVisibleSelected ? "Unselect visible" : "Select visible"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={bulkLoading}
                    onClick={() => handleBulkAction(true)}
                  >
                    Archive selected
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={bulkLoading}
                    onClick={() => handleBulkAction(false)}
                  >
                    Delete selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelected(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <Card padding="lg">
          <p className="text-base font-semibold text-[var(--color-text)]">
            Unable to load links
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {error}
          </p>
          <Button className="mt-4" onClick={refetch}>
            Retry
          </Button>
        </Card>
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LinkCardSkeleton key={i} />
          ))}
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={<Link2 size={28} />}
          title={
            search
              ? "No links matched that search"
              : showArchived
                ? "No archived links yet"
                : "No active links yet"
          }
          description={
            search
              ? "Try a broader search term or reset the current filters."
              : showArchived
                ? "Archive a link from the active list and it will appear here."
                : "Create your first link or import a CSV to populate the manager."
          }
          action={
            !showArchived && !search
              ? { label: "Create link", onClick: () => setCreateOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Showing {links.length} of {data?.total || 0} link(s)
            </p>
            <Button variant="ghost" size="sm" onClick={toggleVisibleSelection}>
              {allVisibleSelected ? "Unselect visible" : "Select visible"}
            </Button>
          </div>
          {links.map((link) => (
            <motion.div
              key={link.short_code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
            >
              <Card padding="lg" className="group">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 flex-1 gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(link.short_code)}
                      onChange={() => toggleSelect(link.short_code)}
                      className="mt-1 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                    />

                    <button
                      onClick={() =>
                        router.push(`/dashboard/links/${link.short_code}`)
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-primary)]">
                          /{link.short_code}
                        </span>
                        {link.title && (
                          <span className="text-sm text-[var(--color-text)]">
                            {link.title}
                          </span>
                        )}
                        {link.custom_alias && (
                          <Badge variant="primary" size="sm">
                            Custom
                          </Badge>
                        )}
                        {link.is_archived && (
                          <Badge variant="warning" size="sm">
                            Archived
                          </Badge>
                        )}
                        {link.password && (
                          <Badge variant="info" size="sm">
                            Password
                          </Badge>
                        )}
                        {link.scheduled_at &&
                          new Date(link.scheduled_at) > new Date() && (
                            <Badge variant="info" size="sm">
                              Scheduled
                            </Badge>
                          )}
                        {link.age_verification > 0 && (
                          <Badge variant="error" size="sm">
                            {AGE_LABELS[link.age_verification]}
                          </Badge>
                        )}
                        {!!link.rotation_targets?.length && (
                          <Badge variant="info" size="sm">
                            Rotates across {link.rotation_targets.length + 1}
                          </Badge>
                        )}
                        <HealthBadge status={link.health_status?.status} />
                      </div>
                      <p className="mt-2 truncate text-base font-medium text-[var(--color-text)]">
                        {link.title || truncate(link.long_url, 90)}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">
                        {link.long_url}
                      </p>
                      {link.health_status?.needs_attention && (
                        <p className="mt-2 text-sm text-[var(--color-warning)]">
                          {link.health_status.failing_destinations} of{" "}
                          {link.health_status.total_destinations} active
                          destination(s) failed the latest health check.
                        </p>
                      )}
                      {link.health_status?.last_checked_at && (
                        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                          Last checked{" "}
                          {formatDateTime(link.health_status.last_checked_at)}
                        </p>
                      )}
                      {link.tags && link.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {link.tags.map((tag) => (
                            <Badge key={tag} size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 xl:items-end">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                      <span className="font-semibold text-[var(--color-text)]">
                        {abbreviateNumber(link.clicks)} clicks
                      </span>
                      <span>{timeAgo(link.created_at)}</span>
                      {link.scheduled_at &&
                        new Date(link.scheduled_at) > new Date() && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={13} />
                            {new Date(link.scheduled_at).toLocaleString()}
                          </span>
                        )}
                      {link.password && (
                        <span className="inline-flex items-center gap-1">
                          <Lock size={13} />
                          Protected
                        </span>
                      )}
                      {link.age_verification > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <ShieldAlert size={13} />
                          {AGE_LABELS[link.age_verification]}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            link.short_code,
                            `${apiUrl}/${link.short_code}`,
                          )
                        }
                      >
                        {copiedCode === link.short_code ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copiedCode === link.short_code ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `${apiUrl}/${link.short_code}`,
                            "_blank",
                            "noopener,noreferrer",
                          )
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
                            `${apiUrl}/${link.short_code}/qr`,
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                        icon={<QrCode size={14} />}
                      >
                        QR
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        loading={
                          busyCode === link.short_code &&
                          busyAction === "archive"
                        }
                        onClick={() =>
                          handleArchiveToggle(link.short_code, link.is_archived)
                        }
                        icon={
                          link.is_archived ? (
                            <RefreshCw size={14} />
                          ) : (
                            <Archive size={14} />
                          )
                        }
                      >
                        {link.is_archived ? "Restore" : "Archive"}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={
                          busyCode === link.short_code &&
                          busyAction === "delete"
                        }
                        onClick={() => handleDelete(link.short_code)}
                        icon={<Trash2 size={14} />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            icon={<ChevronLeft size={14} />}
          >
            Prev
          </Button>
          <span className="text-sm text-[var(--color-text-secondary)] px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={closeCreateModal}
        title="Create link"
        description="Shorten a destination and add the metadata the backend already supports."
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Destination URL *"
            placeholder="https://example.com/very/long/path"
            value={createForm.long_url}
            onChange={(e) =>
              setCreateForm({ ...createForm, long_url: e.target.value })
            }
            icon={<Link2 size={16} />}
            error={
              createForm.long_url && !isValidUrl(createForm.long_url)
                ? "Enter a valid URL"
                : undefined
            }
          />

          {previewLoading && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Fetching preview metadata…
            </p>
          )}

          {preview && (
            <PreviewCard
              preview={preview}
              onApply={() =>
                setCreateForm((current) => ({
                  ...current,
                  title: current.title || preview.title || undefined,
                  description:
                    current.description || preview.description || undefined,
                }))
              }
            />
          )}

          <Input
            label="Custom Code"
            placeholder="my-link"
            value={createForm.custom_code || ""}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                custom_code: e.target.value || undefined,
              })
            }
            hint="Optional. Must be 3-20 letters, numbers, or hyphens."
            error={
              createForm.custom_code &&
              !isValidCustomCode(createForm.custom_code)
                ? "This does not match the backend validation rules."
                : undefined
            }
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Title"
              placeholder="My campaign link"
              value={createForm.title || ""}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  title: e.target.value || undefined,
                })
              }
            />
            <Input
              label="Expires In (hours)"
              type="number"
              placeholder="168"
              value={createForm.expires_in || ""}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  expires_in: Number(e.target.value) || undefined,
                })
              }
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Optional dashboard context for this link"
            value={createForm.description || ""}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                description: e.target.value || undefined,
              })
            }
          />

          <Input
            label="Tags"
            placeholder="Comma separated: campaign, email, spring"
            value={createForm.tags?.join(", ") || ""}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                tags: e.target.value
                  ? e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean)
                  : undefined,
              })
            }
          />

          <RotationTargetsEditor
            targets={createForm.rotation_targets || []}
            onChange={(rotationTargets) =>
              setCreateForm({
                ...createForm,
                rotation_targets: rotationTargets,
              })
            }
          />
          {rotationTargetsError && (
            <p className="text-sm text-[var(--color-error)]">
              {rotationTargetsError}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Password"
              type="password"
              placeholder="Optional password"
              value={createForm.password || ""}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  password: e.target.value || undefined,
                })
              }
            />
            <Select
              label="Age Verification"
              hint="Choose the minimum age required before this link opens."
              value={createForm.age_verification || 0}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  age_verification: Number(e.target.value) || undefined,
                })
              }
            >
              <option value={0}>None</option>
              <option value={1}>13+</option>
              <option value={2}>18+</option>
              <option value={3}>21+</option>
            </Select>
          </div>

          <Input
            label="Schedule Activation"
            type="datetime-local"
            value={
              createForm.scheduled_at
                ? createForm.scheduled_at.slice(0, 16)
                : ""
            }
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                scheduled_at: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : undefined,
              })
            }
            hint="Optional. The backend expects a future RFC3339 timestamp."
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating}
              icon={<Plus size={16} />}
            >
              Create link
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportRows([]);
          setImportError(null);
          setImportFileName("");
        }}
        title="Import links from CSV"
        description="Supported columns: long_url, custom_code, title, tags"
        size="lg"
      >
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)]/70 px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <FileUp size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Choose a CSV file
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Use headers named exactly: <code>long_url</code>,{" "}
                <code>custom_code</code>, <code>title</code>, <code>tags</code>
              </p>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImportFile(file);
                }
              }}
            />
          </label>

          {importFileName && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Loaded file:{" "}
              <span className="font-medium text-[var(--color-text)]">
                {importFileName}
              </span>
            </p>
          )}

          {importError && (
            <div className="rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-error-light)] p-4 text-sm text-[var(--color-text)]">
              {importError}
            </div>
          )}

          {importRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {importRows.length} row(s) ready to import
                </p>
                <Badge variant="primary" size="sm">
                  Previewing first {importSummary.length}
                </Badge>
              </div>
              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
                  <thead className="bg-[var(--color-bg)]/80 text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Long URL</th>
                      <th className="px-4 py-3 font-medium">Custom code</th>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
                    {importSummary.map((row, index) => (
                      <tr key={`${row.long_url}-${index}`}>
                        <td className="px-4 py-3 text-[var(--color-text)]">
                          {truncate(row.long_url, 48)}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {row.custom_code || "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {row.title || "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {row.tags?.join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-[var(--color-border)] pt-4">
            <Button variant="ghost" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitImport}
              loading={importing}
              icon={<Upload size={16} />}
            >
              Import rows
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
