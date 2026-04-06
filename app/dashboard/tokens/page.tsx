"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Clock, Copy, Key, Plus, Settings2, Trash2, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTokens, useClipboard } from "@/lib/hooks";
import { createAPIToken, revokeAPIToken, updateAPITokenRateLimit } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const ALL_SCOPES = ["links:read", "links:write", "analytics:read", "bulk:read", "bulk:write"];

export default function TokensPage() {
  const { tokens, loading, error, refetch } = useTokens();
  const { copied, copy } = useClipboard();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<number>(100);
  const [savingRate, setSavingRate] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Token name is required"); return; }
    if (scopes.length === 0) { toast.error("Select at least one scope"); return; }
    setCreating(true);
    try {
      const res = await createAPIToken({ name: name.trim(), scopes, expires_in: expiresIn || undefined });
      setNewToken(res.token);
      toast.success("Token created. Copy it now because it will not be shown again.");
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to create token");
    } finally { setCreating(false); }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this token? It will be permanently deactivated.")) return;
    try {
      await revokeAPIToken(id);
      toast.success("Token revoked");
      refetch();
    } catch (err: unknown) { toast.error((err as Error).message || "Failed to revoke"); }
  };

  const closeCreate = () => {
    setCreateOpen(false); setName(""); setScopes([]); setExpiresIn(0); setNewToken(null);
  };

  const toggleScope = (s: string) => setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const openRateEditor = (id: string, currentRate: number) => {
    setEditingRateId(id);
    setRateLimit(currentRate);
  };

  const saveRateLimit = async () => {
    if (!editingRateId) return;
    if (rateLimit < 1 || rateLimit > 1000) {
      toast.error("Rate limit must be between 1 and 1000 requests per minute");
      return;
    }

    setSavingRate(true);
    try {
      await updateAPITokenRateLimit(editingRateId, rateLimit);
      toast.success("Rate limit updated");
      setEditingRateId(null);
      refetch();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update rate limit");
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-[var(--color-text)]">API Tokens</h1><p className="text-sm text-[var(--color-text-secondary)] mt-1">Manage personal access tokens for programmatic API access</p></div>
        <Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>Create Token</Button>
      </div>

      {error ? (
        <Card padding="lg">
          <p className="text-base font-semibold text-[var(--color-text)]">Unable to load tokens</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{error}</p>
          <Button className="mt-4" onClick={refetch}>Retry</Button>
        </Card>
      ) : loading ? (
        <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} variant="rect" width="100%" height={80} className="rounded-xl" />)}</div>
      ) : tokens.length === 0 ? (
        <EmptyState icon={<Key size={28} />} title="No API tokens" description="Create a token to access the API programmatically" action={{ label: "Create Token", onClick: () => setCreateOpen(true) }} />
      ) : (
        <div className="space-y-3">
          {tokens.map((token, i) => (
            <motion.div key={token.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--color-text)]">{token.name}</p>
                    <Badge variant={token.is_active ? "success" : "error"} size="sm">{token.is_active ? "Active" : "Revoked"}</Badge>
                    <code className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-alt)] px-1.5 py-0.5 rounded">{token.token_prefix}...</code>
                  </div>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {token.scopes.map(s => <Badge key={s} variant="primary" size="sm">{s}</Badge>)}
                  </div>
                  <div className="flex gap-3 mt-2 text-xs text-[var(--color-text-tertiary)]">
                    <span>Created {formatDate(token.created_at)}</span>
                    {token.last_used_at && <span>Last used {timeAgo(token.last_used_at)}</span>}
                    {token.expires_at && <span className="flex items-center gap-1"><Clock size={10} /> Expires {formatDate(token.expires_at)}</span>}
                    <span className="flex items-center gap-1"><Zap size={10} /> {token.rate_limit} req/min</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {token.is_active && <Button variant="outline" size="sm" onClick={() => openRateEditor(token.id, token.rate_limit)} icon={<Settings2 size={14} />}>Rate limit</Button>}
                  {token.is_active && <Button variant="danger" size="sm" onClick={() => handleRevoke(token.id)} icon={<Trash2 size={14} />}>Revoke</Button>}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={closeCreate} title={newToken ? "Token Created!" : "Create API Token"} size="md">
        {newToken ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--color-warning-light)] border border-[var(--color-warning)]/20">
              <p className="text-sm font-medium text-[var(--color-text)] mb-2">Copy this token now because it will not be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-[var(--color-surface)] p-2 rounded-lg border border-[var(--color-border)] break-all">{newToken}</code>
                <Button variant="secondary" size="sm" onClick={() => copy(newToken)}>{copied ? <Check size={14} /> : <Copy size={14} />}</Button>
              </div>
            </div>
            <Button variant="primary" onClick={closeCreate} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Token Name *" placeholder="My CLI Token" value={name} onChange={e => setName(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] block mb-2">Scopes *</label>
              <div className="flex flex-wrap gap-2">
                {ALL_SCOPES.map(s => (
                  <button key={s} onClick={() => toggleScope(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${scopes.includes(s) ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Input label="Expires In (days)" type="number" placeholder="0 = never" value={expiresIn || ""} onChange={e => setExpiresIn(Number(e.target.value))} hint="Leave empty or 0 for no expiration" />
            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <Button variant="ghost" onClick={closeCreate}>Cancel</Button>
              <Button onClick={handleCreate} loading={creating} icon={<Key size={16} />}>Create Token</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!editingRateId} onClose={() => setEditingRateId(null)} title="Update Rate Limit" size="md">
        <div className="space-y-4">
          <Input
            label="Requests per minute"
            type="number"
            value={rateLimit}
            onChange={e => setRateLimit(Number(e.target.value))}
            hint="The backend accepts values from 1 to 1000."
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setEditingRateId(null)}>Cancel</Button>
            <Button onClick={saveRateLimit} loading={savingRate} icon={<Settings2 size={16} />}>Save rate</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
