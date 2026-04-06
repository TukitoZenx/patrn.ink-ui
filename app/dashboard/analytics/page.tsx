"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  Monitor,
  Globe,
  MousePointerClick,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartSkeleton, StatsCardSkeleton } from "@/components/ui/Skeleton";
import { useLinks, useAnalytics } from "@/lib/hooks";
import { downloadAnalyticsExport, type AnalyticsSummary } from "@/lib/api";
import { abbreviateNumber } from "@/lib/utils";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];
const toArr = (m: Record<string, number>) =>
  Object.entries(m || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value]) => ({ name, value }));
const STAT_CARDS = [
  {
    label: "Total Clicks",
    toneClass: "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
    icon: <MousePointerClick size={20} />,
    getValue: (data: AnalyticsSummary) => data.total_clicks,
  },
  {
    label: "Unique Clicks",
    toneClass:
      "bg-[var(--color-secondary-light)] text-[var(--color-secondary)]",
    icon: <Users size={20} />,
    getValue: (data: AnalyticsSummary) => data.unique_clicks,
  },
  {
    label: "Countries",
    toneClass: "bg-[var(--color-success-light)] text-[var(--color-success)]",
    icon: <Globe size={20} />,
    getValue: (data: AnalyticsSummary) =>
      Object.keys(data.countries || {}).length,
  },
];

function Content() {
  const sp = useSearchParams();
  const [code, setCode] = useState(sp.get("code") || "");
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [end, setEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const { data: ld } = useLinks({ limit: 100 });
  const {
    data: a,
    loading,
    error,
  } = useAnalytics(code, { start_date: start, end_date: end });
  const links = ld?.links || [];
  const ts = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 10,
    fontSize: 13,
  };

  async function handleExport(format: "csv" | "json") {
    try {
      await downloadAnalyticsExport(code, format, start, end);
      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to export analytics");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Analytics
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Dive deep into your link performance
        </p>
      </div>
      <Card>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <Select
              label="Select Link"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            >
              <option value="">Choose a link...</option>
              {links.map((l) => (
                <option key={l.short_code} value={l.short_code}>
                  /{l.short_code} — {l.title || l.long_url.slice(0, 50)}
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input
            label="End"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
          {code && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                icon={<Download size={14} />}
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                icon={<Download size={14} />}
              >
                JSON
              </Button>
            </div>
          )}
        </div>
      </Card>

      {!code ? (
        <EmptyState
          icon={<BarChart3 size={28} />}
          title="Select a link"
          description="Choose a link above to view detailed analytics"
        />
      ) : loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <ChartSkeleton />
        </>
      ) : error ? (
        <Card padding="lg">
          <p className="text-base font-semibold text-[var(--color-text)]">
            Unable to load analytics
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {error}
          </p>
        </Card>
      ) : a ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STAT_CARDS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.toneClass}`}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-medium uppercase tracking-wider">
                        {s.label}
                      </p>
                      <p className="text-2xl font-bold text-[var(--color-text)]">
                        {abbreviateNumber(s.getValue(a))}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
          <Card padding="lg">
            <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">
              Click Timeline
            </h3>
            {a.timeline.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={a.timeline}>
                  <defs>
                    <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                  <Tooltip contentStyle={ts} />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#gc)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-tertiary)]">
                No data
              </div>
            )}
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Devices",
                icon: <Monitor size={16} />,
                data: a.device_types,
              },
              {
                title: "Browsers",
                icon: <Globe size={16} />,
                data: a.browser_types,
              },
            ].map((ch) => (
              <Card key={ch.title} padding="lg">
                <h3 className="text-base font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                  {ch.icon} {ch.title}
                </h3>
                {Object.keys(ch.data || {}).length ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={toArr(ch.data)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {toArr(ch.data).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={ts} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)] text-center py-10">
                    No data
                  </p>
                )}
              </Card>
            ))}
            <Card padding="lg" className="md:col-span-2">
              <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">
                Top Referrers
              </h3>
              {Object.keys(a.top_referrers || {}).length ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={toArr(a.top_referrers)} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                    />
                    <XAxis
                      type="number"
                      tick={{
                        fontSize: 11,
                        fill: "var(--color-text-tertiary)",
                      }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{
                        fontSize: 11,
                        fill: "var(--color-text-tertiary)",
                      }}
                    />
                    <Tooltip contentStyle={ts} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[var(--color-text-tertiary)] text-center py-10">
                  No data
                </p>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}
