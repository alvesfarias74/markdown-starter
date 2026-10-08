import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { myProQuery } from "@/lib/my-pro-query";
import { dashboardQuery } from "@/lib/dashboard-query";
import { sendQuote, setAvailability } from "@/lib/dashboard.functions";
import { brl, URGENCY } from "@/lib/commission";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/site/Field";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({ meta: [{ title: "Meu painel — A Seu Serviço" }, { name: "description", content: "Seu escritório digital na A Seu Serviço." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(myProQuery()), context.queryClient.ensureQueryData(dashboardQuery())]),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar seu painel.</p>,
  component: Painel,
});

function Painel() {
  const { data } = useSuspenseQuery(myProQuery());
  const { data: dash } = useSuspenseQuery(dashboardQuery());
  const qc = useQueryClient();
  const toggle = useServerFn(setAvailability);
  const { items, percent } = data.completeness;
  const published = data.pro?.status === "published";
  const firstName = (data.account.full_name || "profissional").split(" ")[0];

  if (!dash.pro) {
    return (
      <section className="mx-auto max-w-3xl px-4 pt-10">
        <h1 className="text-4xl font-bold">Olá, {firstName}!</h1>
        <p className="mt-2 text-muted-foreground">Vamos montar sua vitrine profissional. Leva poucos minutos.</p>
        <Link to="/painel/perfil" search={{ passo: 1 }} className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Começar meu perfil</Link>
      </section>
    );
  }

  const s = dash.stats!;
  const cards = [
    { label: "Solicitações recebidas", value: s.received },
    { label: "Orçamentos enviados", value: s.quotesSent },
    { label: "Serviços em andamento", value: s.inProgress },
    { label: "Serviços concluídos", value: s.completed },
    { label: "Avaliação média", value: s.ratingAvg ? `${s.ratingAvg.toFixed(1)} ★` : "—", sub: `${s.ratingCount} avaliações` },
    { label: "Ganhos", value: brl(s.earnedTotal), sub: "total recebido" },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 pt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Olá, {firstName}!</h1>
          <p className="mt-1 text-muted-foreground">
            {published ? "Seu perfil profissional está publicado." : "Seu perfil ainda é um rascunho. Publique para aparecer nas buscas."}
          </p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3">
          <Switch
            checked={dash.pro.is_available}
            onCheckedChange={async (v) => {
              try { await toggle({ data: { is_available: v } }); await qc.invalidateQueries(); }
              catch { toast.error("Não foi possível atualizar."); }
            }}
          />
          <span className="font-semibold">{dash.pro.is_available ? "🟢 Disponível para novos serviços" : "⚪ Indisponível no momento"}</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{c.value}</p>
            {c.sub && <p className="text-xs text-muted-foreground">{c.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Opportunities items={dash.opportunities ?? []} available={dash.pro.is_available} published={published} />

        <div className="space-y-6">
          <div className="rounded-3xl border bg-card p-6">
            <p className="font-semibold">Seu perfil está {percent}% completo.</p>
            <Progress value={percent} className="mt-3 h-2" />
            <ul className="mt-4 space-y-1">
              {items.map((i) => (
                <li key={i.key}>
                  <Link to="/painel/perfil" search={{ passo: i.step }} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                    <span className={`grid h-5 w-5 place-items-center rounded border ${i.done ? "border-primary bg-primary text-primary-foreground" : ""}`}>{i.done && <Check className="h-3 w-3" />}</span>
                    <span className={i.done ? "text-muted-foreground" : "font-medium"}>{i.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Perfis completos têm mais informações para ajudar clientes a escolherem um profissional.</p>
            <Link to="/painel/perfil" search={{ passo: published ? 2 : 1 }} className="mt-4 block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground">{published ? "Editar perfil" : "Continuar cadastro"}</Link>
          </div>
          {published && <ShareCard slug={dash.pro.slug} />}
        </div>
      </div>

      <p className="rounded-2xl bg-accent p-4 text-center text-sm text-accent-foreground">Esta plataforma ajuda você a encontrar clientes e organizar seus serviços.</p>
    </section>
  );
}

function ShareCard({ slug }: { slug: string }) {
  const [url, setUrl] = useState(`/profissional/${slug}`);
  useEffect(() => setUrl(`${window.location.origin}/profissional/${slug}`), [slug]);
  const text = `Confira meu perfil profissional na A Seu Serviço: ${url}`;
  return (
    <div className="rounded-3xl bg-ink p-6 text-ink-foreground">
      <p className="font-display text-xl font-bold">Divulgue seu perfil.</p>
      <p className="mt-1 text-sm opacity-80">Envie seu link para clientes e conhecidos. Não precisa ter redes sociais.</p>
      <p className="mt-4 break-all rounded-xl bg-background/10 px-3 py-2 text-sm">{url}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(url); toast.success("Link copiado!"); }} className="flex items-center justify-center gap-2 rounded-xl bg-highlight py-2.5 text-sm font-semibold text-highlight-foreground"><Copy className="h-4 w-4" />Copiar link</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-ink-foreground/30 py-2.5 text-sm font-semibold">WhatsApp</a>
        <button type="button" onClick={async () => { if (navigator.share) { try { await navigator.share({ title: "A Seu Serviço", text, url }); } catch { /* cancelado */ } } else { await navigator.clipboard.writeText(text); toast.success("Texto copiado!"); } }} className="flex items-center justify-center gap-2 rounded-xl border border-ink-foreground/30 py-2.5 text-sm font-semibold"><Share2 className="h-4 w-4" />Outros</button>
        <Link to="/profissional/$slug" params={{ slug }} className="flex items-center justify-center gap-2 rounded-xl border border-ink-foreground/30 py-2.5 text-sm font-semibold"><ExternalLink className="h-4 w-4" />Ver página</Link>
      </div>
    </div>
  );
}

type Opp = { id: string; service_name: string; description: string; city: string | null; state: string | null; neighborhood: string | null; desired_date: string | null; urgency: string; direct: boolean };

function Opportunities({ items, available, published }: { items: Opp[]; available: boolean; published: boolean }) {
  const [open, setOpen] = useState<Opp | null>(null);
  return (
    <div className="rounded-3xl border bg-card p-6">
      <h2 className="text-xl font-bold">Novas oportunidades</h2>
      <p className="text-sm text-muted-foreground">Pedidos compatíveis com seus serviços e sua região.</p>
      {!available ? (
        <p className="mt-6 rounded-xl bg-muted p-4 text-sm">Você está indisponível. Ative sua disponibilidade para ver novas oportunidades.</p>
      ) : items.length === 0 ? (
        <p className="mt-6 rounded-xl bg-muted p-4 text-sm">Nenhuma oportunidade no momento. Quando clientes da sua região pedirem um serviço que você oferece, ele aparecerá aqui.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((o) => (
            <li key={o.id} className="rounded-2xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{o.service_name}</p>
                {o.direct && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Pedido para você</span>}
                <span className={`rounded-full px-2 py-0.5 text-xs ${o.urgency === "urgente" || o.urgency === "alta" ? "bg-highlight text-highlight-foreground" : "bg-muted"}`}>{URGENCY[o.urgency as keyof typeof URGENCY] ?? o.urgency}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{[o.neighborhood, o.city, o.state].filter(Boolean).join(", ")}{o.desired_date && ` · para ${new Date(o.desired_date + "T12:00").toLocaleDateString("pt-BR")}`}</span>
                <button type="button" disabled={!published} onClick={() => setOpen(o)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Enviar orçamento</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <QuoteDialog opp={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function QuoteDialog({ opp, onClose }: { opp: Opp | null; onClose: () => void }) {
  const send = useServerFn(sendQuote);
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={!!opp} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Enviar orçamento · {opp?.service_name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Valor (R$)" hint="Deixe em branco se precisar avaliar no local."><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="150,00" /></Field>
          <Field label="Mensagem para o cliente"><textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} maxLength={1000} className={inputClass} placeholder="Explique o que está incluído, prazo e como você trabalha." /></Field>
          <button type="button" disabled={busy} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60"
            onClick={async () => {
              if (!opp) return;
              const n = amount.trim() ? Number(amount.replace(",", ".")) : null;
              if (n !== null && (!Number.isFinite(n) || n < 0)) return void toast.error("Valor inválido.");
              if (msg.trim().length < 10) return void toast.error("Escreva uma mensagem um pouco maior.");
              setBusy(true);
              try { await send({ data: { request_id: opp.id, amount: n, message: msg } }); toast.success("Orçamento enviado!"); setAmount(""); setMsg(""); onClose(); await qc.invalidateQueries({ queryKey: ["dashboard"] }); }
              catch (e) { toast.error((e as Error).message || "Não foi possível enviar."); }
              finally { setBusy(false); }
            }}>
            {busy ? "Enviando..." : "Enviar orçamento"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

