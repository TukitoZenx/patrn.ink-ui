"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Copy,
  Link2,
  MousePointerClick,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCardSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";
import { useClipboard, useLinks } from "@/lib/hooks";
import { createLink, type CreateLinkResponse, type Link as LinkRecord } from "@/lib/api";
import { abbreviateNumber, isValidUrl, timeAgo, truncate } from "@/lib/utils";
import { toast } from "sonner";

const RECENT_LIMIT = 8;
const EMPTY_LINKS: LinkRecord[] = [];

export default function DashboardPage() {
  const router = useRouter();
  const { copy } = useClipboard();
  const { data, loading, error, refetch } = useLinks({
    limit: RECENT_LIMIT,
    sort_by: "created_at",
    sort_order: "desc",
  });

  const [quickUrl, setQuickUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<CreateLinkResponse | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const links = data?.links ?? EMPTY_LINKS;
  const totalLinks = data?.total || 0;
  const stats = useMemo(() => {
    const recentClicks = links.reduce((sum, link) => sum + link.clicks, 0);
    const recentCustomCodes = links.filter((link) => link.custom_alias).length;
    const scheduledSoon = links.filter((link) => Boolean(link.scheduled_at && new Date(link.scheduled_at) > new Date())).length;
    const topRecent = links.length ? links.reduce((best, next) => (best.clicks >= next.clicks ? best : next)) : null;
    return { recentClicks, recentCustomCodes, scheduledSoon, topRecent };
  }, [links]);
  const topRecent = stats.topRecent;

  async function handleQuickCreate() {
    if (!quickUrl || !isValidUrl(quickUrl)) {
      toast.error("Enter a valid destination URL.");
      return;
    }

    setCreating(true);
    try {
      const created = await createLink({ long_url: quickUrl });
      setLastCreated(created);
      setQuickUrl("");
      refetch();
      toast.success("Link created successfully.");
    } catch (err) {
      toast.error((err as Error).message || "Failed to create the link.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(code: string, url: string) {
    await copy(url);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1800);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card padding="lg" className="gradient-border">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary" size="md">Quick create</Badge>
              <Badge size="md">Recent view capped at {RECENT_LIMIT} links</Badge>
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                Everything important at a glance.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                Total links are exact from the API. Activity cards below summarize your latest {RECENT_LIMIT} links so the
                dashboard stays fast and honest about what it is showing.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder="Paste a destination URL to shorten"
                value={quickUrl}
                onChange={(event) => setQuickUrl(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleQuickCreate()}
                icon={<Link2 size={16} />}
                className="flex-1"
              />
              <Button onClick={handleQuickCreate} loading={creating} icon={<Plus size={16} />}>
                Shorten URL
              </Button>
            </div>

            {lastCreated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success-light)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">Newest short link</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{lastCreated.short_url}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(lastCreated.short_code, lastCreated.short_url)}
                  >
                    {copiedCode === lastCreated.short_code ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode === lastCreated.short_code ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/links/${lastCreated.short_code}`)}
                  >
                    View details <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-bg-alt)] text-[var(--color-text)]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-text)]">Operational shortcuts</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Jump into the flows that keep the dashboard moving.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              {
                title: "Manage your full link inventory",
                description: "Search, bulk archive, import CSV rows, and export JSON or CSV with auth-aware downloads.",
                href: "/dashboard/links",
              },
              {
                title: "Inspect performance trends",
                description: "Choose a single link, filter by date, and export analytics without leaving the UI.",
                href: "/dashboard/analytics",
              },
              {
                title: "Create or rotate API access",
                description: "Issue scoped tokens and adjust rate limits when you need automation support.",
                href: "/dashboard/tokens",
              },
            ].map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-4 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
                  </div>
                  <WandSparkles size={17} className="mt-1 text-[var(--color-primary)]" />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatsCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total links",
              value: abbreviateNumber(totalLinks),
              helper: "Exact count from /api/links",
              icon: <Link2 size={18} />,
              toneClass: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
            },
            {
              label: `Recent clicks`,
              value: abbreviateNumber(stats.recentClicks),
              helper: `Across latest ${links.length || RECENT_LIMIT} links`,
              icon: <MousePointerClick size={18} />,
              toneClass: "bg-[var(--color-secondary-light)] text-[var(--color-secondary)]",
            },
            {
              label: "Custom codes in view",
              value: abbreviateNumber(stats.recentCustomCodes),
              helper: "Latest links with custom aliases",
              icon: <Sparkles size={18} />,
              toneClass: "bg-[var(--color-success-light)] text-[var(--color-success)]",
            },
            {
              label: "Scheduled ahead",
              value: abbreviateNumber(stats.scheduledSoon),
              helper: "Future activations in recent view",
              icon: <CalendarClock size={18} />,
              toneClass: "bg-[var(--color-info-light)] text-[var(--color-info)]",
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{item.value}</p>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{item.helper}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.toneClass}`}>
                    {item.icon}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Latest links</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Your newest links, with quick access to copy and inspect.</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/links")}>
            Open manager <ArrowRight size={14} />
          </Button>
        </div>

        {error ? (
          <Card padding="lg">
            <p className="text-base font-semibold text-[var(--color-text)]">Unable to load dashboard links</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{error}</p>
            <Button className="mt-4" onClick={refetch}>Retry</Button>
          </Card>
        ) : loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <LinkCardSkeleton key={index} />
            ))}
          </div>
        ) : links.length === 0 ? (
          <EmptyState
            icon={<Link2 size={28} />}
            title="No links yet"
            description="Create your first short link above, then come back here for recent activity and faster management."
          />
        ) : (
          <div className="space-y-3">
            {links.slice(0, 5).map((link, index) => (
              <motion.div
                key={link.short_code}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card
                  hover
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => router.push(`/dashboard/links/${link.short_code}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--color-primary)]">/{link.short_code}</span>
                      {link.custom_alias && <Badge variant="primary" size="sm">Custom</Badge>}
                      {link.is_archived && <Badge variant="warning" size="sm">Archived</Badge>}
                      {link.scheduled_at && new Date(link.scheduled_at) > new Date() && (
                        <Badge variant="info" size="sm">Scheduled</Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--color-text)]">{link.title || truncate(link.long_url, 78)}</p>
                    <p className="mt-1 truncate text-sm text-[var(--color-text-secondary)]">{link.long_url}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-base font-semibold text-[var(--color-text)]">{abbreviateNumber(link.clicks)}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">{timeAgo(link.created_at)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCopy(link.short_code, `${apiUrl}/${link.short_code}`);
                      }}
                    >
                      {copiedCode === link.short_code ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {topRecent && (
        <Card padding="lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Top performer in the recent view</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                /{topRecent.short_code} has {abbreviateNumber(topRecent.clicks)} clicks in the latest dashboard slice.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push(`/dashboard/links/${topRecent.short_code}`)}>
              Inspect link <ArrowRight size={14} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
