"use client";

import { Globe, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { RotationTargetInput } from "@/lib/api";

interface RotationTargetsEditorProps {
  targets: RotationTargetInput[];
  onChange: (targets: RotationTargetInput[]) => void;
}

export function RotationTargetsEditor({
  targets,
  onChange,
}: RotationTargetsEditorProps) {
  const updateTarget = (index: number, patch: Partial<RotationTargetInput>) => {
    onChange(
      targets.map((target, currentIndex) =>
        currentIndex === index ? { ...target, ...patch } : target,
      ),
    );
  };

  const addTarget = () => {
    onChange([...targets, { url: "", label: "", is_active: true }]);
  };

  const removeTarget = (index: number) => {
    onChange(targets.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Link rotation
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-tertiary)]">
            Rotate visitors across the primary destination and any active
            alternate URLs using round-robin delivery.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addTarget}
          icon={<Plus size={14} />}
        >
          Add target
        </Button>
      </div>

      {targets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)]/65 px-4 py-4 text-sm text-[var(--color-text-secondary)]">
          No alternate destinations yet. Add one when you want this short link
          to rotate traffic.
        </div>
      ) : (
        <div className="space-y-3">
          {targets.map((target, index) => (
            <div
              key={`${target.url}-${index}`}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-4"
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                <Input
                  label={`Destination ${index + 2}`}
                  placeholder="https://example.com/variant"
                  value={target.url}
                  onChange={(event) =>
                    updateTarget(index, { url: event.target.value })
                  }
                  icon={<Globe size={16} />}
                />
                <Input
                  label="Label"
                  placeholder="Optional note"
                  value={target.label || ""}
                  onChange={(event) =>
                    updateTarget(index, { label: event.target.value })
                  }
                />
                <div className="flex items-end gap-2">
                  <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={target.is_active !== false}
                      onChange={(event) =>
                        updateTarget(index, { is_active: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                    />
                    Active
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTarget(index)}
                    icon={<Trash2 size={14} />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
