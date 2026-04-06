"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Chrome,
  Github,
  KeyRound,
  Link2,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BrandMark } from "@/components/ui/BrandMark";
import { isAuthenticated, getLoginUrl } from "@/lib/auth";

const featureCards = [
  {
    title: "Control how links go live",
    description:
      "Schedule launches, set expirations, and protect sensitive destinations without creating separate flows.",
    icon: Link2,
  },
  {
    title: "See the story behind every click",
    description:
      "Track referrers, devices, browsers, and click trends in a view that makes performance easy to understand.",
    icon: BarChart3,
  },
  {
    title: "Run link operations without the mess",
    description:
      "Manage large link libraries with bulk workflows, QR distribution, archiving, and fast edits from one place.",
    icon: KeyRound,
  },
];

const highlightStats = [
  { label: "Launch control", value: "Schedules, expirations, gates" },
  { label: "Clear reporting", value: "Timeline, referrer, device data" },
  { label: "Operational scale", value: "Bulk workflows, QR, archives" },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex items-center justify-between rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/85 px-5 py-4 shadow-sm backdrop-blur sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size={44} priority />
            <div>
              <p className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
                patrn.ink
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Link ops for modern teams
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <Badge variant="primary" size="md">
              Link operations, simplified
            </Badge>
            <a
              href={getLoginUrl("google")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl gradient-primary px-4 text-sm font-semibold whitespace-nowrap text-white shadow-lg shadow-[var(--color-primary)]/20 transition-transform hover:-translate-y-0.5"
            >
              <Chrome size={16} />
              Continue with Google
            </a>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-8 shadow-xl shadow-black/5 sm:px-8 sm:py-10"
          >
            <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top_left,rgba(17,118,110,0.18),transparent_50%),radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_40%)]" />
            <div className="relative flex flex-col gap-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="info" size="md">
                  Campaign control built in
                </Badge>
                <Badge size="md">Analytics that explain performance</Badge>
              </div>

              <div className="max-w-2xl space-y-5">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl lg:text-6xl">
                  Shorten, track, and operate every link from one calm
                  dashboard.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg">
                  patrn.ink is built for teams that need more than a redirect.
                  Launch links on a schedule, protect access, share through QR,
                  and understand performance without stitching together extra
                  tools.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={getLoginUrl("google")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl gradient-primary px-5 text-sm font-semibold text-white shadow-lg shadow-[var(--color-primary)]/20 transition-transform hover:-translate-y-0.5"
                >
                  <Chrome size={17} />
                  Continue with Google
                </a>
                <a
                  href={getLoginUrl("github")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)]"
                >
                  <Github size={17} />
                  Continue with GitHub
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlightStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/75 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-base font-semibold text-[var(--color-text)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="grid gap-4"
          >
            <Card padding="lg" className="gradient-border">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      Why teams choose patrn.ink
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      It combines campaign control, trustworthy analytics, and
                      operational tools in one product instead of scattering
                      them across separate services.
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <li className="flex items-start gap-3">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 text-[var(--color-success)]"
                    />
                    Launch scheduled, expiring, password-protected, or age-gated
                    links from the same workflow
                  </li>
                  <li className="flex items-start gap-3">
                    <QrCode
                      size={16}
                      className="mt-0.5 text-[var(--color-info)]"
                    />
                    Create QR-ready links and manage large batches with import,
                    export, tagging, and archive controls
                  </li>
                  <li className="flex items-start gap-3">
                    <BarChart3
                      size={16}
                      className="mt-0.5 text-[var(--color-warning)]"
                    />
                    Understand performance with click timelines plus referrer,
                    browser, and device breakdowns
                  </li>
                </ul>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {featureCards.map(({ title, description, icon: Icon }, index) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.06 }}
                >
                  <Card hover padding="lg" className="h-full">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-bg-alt)] text-[var(--color-text)]">
                      <Icon size={19} />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                      {title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="grid gap-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-5 shadow-sm sm:grid-cols-3 sm:p-6">
          {[
            "Run time-sensitive launches with scheduling, expiration windows, and built-in access controls",
            "Keep growing link libraries organized with custom codes, tags, edits, and clean archive workflows",
            "Move from one-off links to repeatable operations with QR sharing and bulk management tools",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg)]/75 px-4 py-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <ArrowRight size={16} />
              </div>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {item}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
