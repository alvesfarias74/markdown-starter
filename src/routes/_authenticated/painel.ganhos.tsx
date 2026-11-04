import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { dashboardQuery } from "@/lib/dashboard-query";
import { brl, PLATFORM_COMMISSION_LABEL } from "@/lib/commission";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/painel/ganhos")({
  head: () => pageHead("Meus ganhos — A Seu Serviço", "Consulte seus saldos, repasses e comissão na A Seu Serviço.", true),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar seus ganhos.</p>,
  component: Ganhos,
});

function Ganhos() {
  const { data } = useSuspenseQuery(dashboardQuery());
  const e = data.earnings ?? { pending: 0, available: 0, received: 0, gross: 0, fees: 0 };
  const done = (data.jobs ?? []).filter((j) => j.status === "completed");
  return (
    <section className="mx-auto max-w-4xl px-4 pt-8">
      <h1 className="text-3xl font-bold">Meus ganhos</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[["Saldo pendente", e.pending, "Serviços concluídos aguardando liberação"], ["Saldo disponível", e.available, "Pronto para saque"], ["Total recebido", e.received, "Já pago a você"]].map(([l, v, h]) => (
          <div key={l as string} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-3xl font-bold">{brl(v as number)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{h}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-accent p-5 text-accent-foreground">
        <p className="font-semibold">Comissão da plataforma: {PLATFORM_COMMISSION_LABEL} por serviço concluído</p>
        <p className="mt-1 text-sm">Exemplo: em um serviço de {brl(100)}, a plataforma fica com {brl(8)} e você recebe {brl(92)}.</p>
        <p className="mt-2 text-sm">Até agora: {brl(e.gross)} em serviços · {brl(e.fees)} de comissão · {brl(e.gross - e.fees)} para você.</p>
      </div>
      <h2 className="mt-8 text-xl font-bold">Extrato</h2>
      {done.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">Seus ganhos aparecerão aqui quando você concluir serviços pela plataforma.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left"><tr><th className="p-3">Serviço</th><th className="p-3">Valor</th><th className="p-3">Comissão</th><th className="p-3">Você recebe</th></tr></thead>
            <tbody>{done.map((j) => <tr key={j.id} className="border-t"><td className="p-3">{j.title}</td><td className="p-3">{brl(j.amount)}</td><td className="p-3">−{brl(j.platform_fee)}</td><td className="p-3 font-semibold">{brl(j.professional_net)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
