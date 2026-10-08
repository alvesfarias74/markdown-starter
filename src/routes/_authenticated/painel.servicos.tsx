import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { dashboardQuery } from "@/lib/dashboard-query";
import { brl, JOB_STATUS } from "@/lib/commission";

export const Route = createFileRoute("/_authenticated/painel/servicos")({
  head: () => ({ meta: [{ title: "Meus serviços — A Seu Serviço" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar seus serviços.</p>,
  component: Servicos,
});

const TABS = ["scheduled", "in_progress", "completed", "cancelled"] as const;

function Servicos() {
  const { data } = useSuspenseQuery(dashboardQuery());
  const [tab, setTab] = useState<(typeof TABS)[number]>("scheduled");
  const jobs = (data.jobs ?? []).filter((j) => j.status === tab);
  return (
    <section className="mx-auto max-w-4xl px-4 pt-8">
      <h1 className="text-3xl font-bold">Meus serviços</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-full border px-4 py-2 text-sm font-medium ${tab === t ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
            {JOB_STATUS[t]} ({(data.jobs ?? []).filter((j) => j.status === t).length})
          </button>
        ))}
      </div>
      {jobs.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">Nenhum serviço {JOB_STATUS[tab].toLowerCase()} por enquanto. Quando um cliente contratar você, o serviço aparecerá aqui.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {jobs.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card p-4">
              <div>
                <p className="font-semibold">{j.title}</p>
                <p className="text-sm text-muted-foreground">{j.scheduled_for ? new Date(j.scheduled_for).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Data a combinar"}</p>
              </div>
              <p className="font-display text-lg font-bold">{brl(j.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
