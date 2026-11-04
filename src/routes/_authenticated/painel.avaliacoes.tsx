import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { dashboardQuery } from "@/lib/dashboard-query";
import { respondReview } from "@/lib/dashboard.functions";
import { inputClass } from "@/components/site/Field";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/painel/avaliacoes")({
  head: () => pageHead("Minhas avaliações — A Seu Serviço", "Veja sua reputação e responda às avaliações dos clientes.", true),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar suas avaliações.</p>,
  component: Avaliacoes,
});

function Avaliacoes() {
  const { data } = useSuspenseQuery(dashboardQuery());
  const reviews = data.reviews ?? [];
  return (
    <section className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="text-3xl font-bold">Minhas avaliações</h1>
      <div className="mt-6 flex gap-3">
        <div className="flex-1 rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Nota média</p><p className="font-display text-3xl font-bold">{data.stats?.ratingAvg?.toFixed(1) ?? "—"}</p></div>
        <div className="flex-1 rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Avaliações</p><p className="font-display text-3xl font-bold">{data.stats?.ratingCount ?? 0}</p></div>
      </div>
      {reviews.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground">Você ainda não recebeu avaliações. Elas aparecem depois que um cliente conclui um serviço com você.</p>
      ) : (
        <ul className="mt-6 space-y-3">{reviews.map((r) => <ReviewItem key={r.id} r={r} />)}</ul>
      )}
    </section>
  );
}

function ReviewItem({ r }: { r: { id: string; client_name: string; rating: number; comment: string | null; response: string | null; created_at: string } }) {
  const respond = useServerFn(respondReview);
  const qc = useQueryClient();
  const [text, setText] = useState(r.response ?? "");
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{r.client_name || "Cliente"}</p>
        <span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-highlight text-highlight" : "text-border"}`} />)}</span>
      </div>
      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
      {r.comment && <p className="mt-2">{r.comment}</p>}
      {r.response && !editing ? (
        <div className="mt-3 rounded-xl bg-muted p-3 text-sm"><p className="font-semibold">Sua resposta</p><p>{r.response}</p><button type="button" onClick={() => setEditing(true)} className="mt-1 text-xs text-primary">Editar</button></div>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={1000} className={inputClass} placeholder="Agradeça ou responda ao cliente" />
          <button type="button" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={async () => {
              if (text.trim().length < 2) return;
              try { await respond({ data: { id: r.id, response: text } }); setEditing(false); toast.success("Resposta publicada."); await qc.invalidateQueries({ queryKey: ["dashboard"] }); }
              catch { toast.error("Não foi possível responder."); }
            }}>Responder</button>
        </div>
      )}
    </li>
  );
}
