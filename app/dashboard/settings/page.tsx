"use client";

import { motion } from "framer-motion";
import { User, LogOut, Palette } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/hooks";
import { useTheme } from "@/components/providers/ThemeProvider";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width="30%" height={28} />
        <Skeleton variant="rect" width="100%" height={200} className="rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card padding="lg">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <User size={18} /> Profile
          </h2>
          {user && (
            <div className="flex items-center gap-4">
              <Avatar src={user.picture} name={user.name} size="lg" />
              <div>
                <p className="text-lg font-semibold text-[var(--color-text)]">{user.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="primary" size="sm">{user.provider}</Badge>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    Joined {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card padding="lg">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <Palette size={18} /> Appearance
          </h2>
          <div className="flex gap-3">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
                  theme === t
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg mb-2 ${t === "light" ? "bg-white border border-gray-200" : "bg-gray-900 border border-gray-700"}`} />
                <p className="text-sm font-medium text-[var(--color-text)] capitalize">{t}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {t === "light" ? "Clean and bright" : "Easy on the eyes"}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Danger zone */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card padding="lg" className="border-[var(--color-error)]/30">
          <h2 className="text-base font-semibold text-[var(--color-error)] mb-2">Sign Out</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            You will need to sign in again with your OAuth provider.
          </p>
          <Button variant="danger" onClick={logout} icon={<LogOut size={16} />}>
            Sign Out
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
