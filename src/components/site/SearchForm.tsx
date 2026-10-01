import { useNavigate } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { useState } from "react";

export function SearchForm({ initialQ = "", initialLocal = "" }: { initialQ?: string; initialLocal?: string }) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQ);
  const [local, setLocal] = useState(initialLocal);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/buscar", search: { q: q.trim() || undefined, local: local.trim() || undefined } });
      }}
      className="grid gap-2 rounded-3xl border bg-card p-2 shadow-soft md:grid-cols-[1fr_1fr_auto]"
    >
      <label className="flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:bg-muted">
        <Search className="h-5 w-5 shrink-0 text-primary" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qual serviço você precisa?" aria-label="Qual serviço você precisa?" maxLength={100} className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
      </label>
      <label className="flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:bg-muted md:border-l">
        <MapPin className="h-5 w-5 shrink-0 text-highlight" />
        <input value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Em qual cidade ou região?" aria-label="Em qual cidade ou região?" maxLength={100} className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
      </label>
      <button type="submit" className="rounded-2xl bg-highlight px-6 py-3 font-semibold text-highlight-foreground transition hover:brightness-105">
        Encontrar profissional
      </button>
    </form>
  );
}
