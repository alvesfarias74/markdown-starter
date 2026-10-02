import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | undefined; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}
    >
      {children}
    </button>
  );
}
