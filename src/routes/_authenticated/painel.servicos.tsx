import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, CheckCircle2, Clock, PlayCircle, Plus, XCircle } from "lucide-react";
import { dashboardQuery } from "@/lib/dashboard-query";
import { updateJobStatus, createJob } from "@/lib/dashboard.functions";
import { brl, JOB_STATUS } from "@/lib/commission";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputClass } from "@/components/site/Field";

export const Route = createFileRoute("/_authenticated/painel/servicos")({
  head: () => ({ meta: [{ title: "Meus serviços — A Seu Serviço" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar seus serviços.</p>,
  component: Servicos,
});

const TABS = ["scheduled", "in_progress", "completed", "cancelled"] as const;

function Servicos() {
  const { data } = useSuspenseQuery(dashboardQuery());
  const qc = useQueryClient();
  const updateStatus = useServerFn(updateJobStatus);
  const [tab, setTab] = useState<(typeof TABS)[number]>("scheduled");
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const jobs = (data.jobs ?? []).filter((j) => j.status === tab);

  const handleStatusChange = async (id: string, status: (typeof TABS)[number]) => {
    setBusyId(id);
    try {
      await updateStatus({ data: { id, status } });
      toast.success(status === "completed" ? "Serviço marcado como concluído!" : "Status do serviço atualizado.");
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível atualizar o serviço.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 pt-8 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus serviços</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe serviços agendados, em execução e finalizados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewJobOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo serviço
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = (data.jobs ?? []).filter((j) => j.status === t).length;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                tab === t ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
              }`}
            >
              {JOB_STATUS[t]} ({count})
            </button>
          );
        })}
      </div>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-semibold text-foreground">Nenhum serviço {JOB_STATUS[tab].toLowerCase()} no momento.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando um cliente contratar você ou quando você registrar um serviço, ele aparecerá nesta lista.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-2xl border bg-card p-5 shadow-xs transition hover:shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{j.title}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        j.status === "completed"
                          ? "bg-green-500/10 text-green-700"
                          : j.status === "in_progress"
                            ? "bg-highlight/15 text-highlight-foreground"
                            : j.status === "scheduled"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {JOB_STATUS[j.status as keyof typeof JOB_STATUS]}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {j.scheduled_for
                      ? new Date(j.scheduled_for).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                      : "Data a combinar"}
                    {j.completed_at && ` · Concluído em ${new Date(j.completed_at).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>

                <div className="text-right sm:shrink-0">
                  <p className="font-display text-xl font-bold text-foreground">{brl(j.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    Você recebe: <span className="font-semibold text-primary">{brl(j.professional_net)}</span> (taxa 8%: −{brl(j.platform_fee)})
                  </p>
                </div>
              </div>

              {/* Ações contextuais de transição de status */}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-3">
                {j.status === "scheduled" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === j.id}
                      onClick={() => handleStatusChange(j.id, "in_progress")}
                      className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      <PlayCircle className="h-3.5 w-3.5 text-primary" />
                      Iniciar serviço
                    </button>
                    <button
                      type="button"
                      disabled={busyId === j.id}
                      onClick={() => handleStatusChange(j.id, "completed")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Marcar concluído
                    </button>
                    <button
                      type="button"
                      disabled={busyId === j.id}
                      onClick={() => {
                        if (confirm("Deseja realmente cancelar este serviço?")) handleStatusChange(j.id, "cancelled");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                  </>
                )}

                {j.status === "in_progress" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === j.id}
                      onClick={() => handleStatusChange(j.id, "completed")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Concluir serviço
                    </button>
                    <button
                      type="button"
                      disabled={busyId === j.id}
                      onClick={() => {
                        if (confirm("Deseja realmente cancelar este serviço?")) handleStatusChange(j.id, "cancelled");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar
                    </button>
                  </>
                )}

                {j.status === "completed" && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Repasse: {j.payout_status === "paid" ? "🟢 Pago" : j.payout_status === "available" ? "🟡 Disponível" : "⚪ Aguardando liberação"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewJobDialog open={newJobOpen} onClose={() => setNewJobOpen(false)} />
    </section>
  );
}

function NewJobDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const register = useServerFn(createJob);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (title.trim().length < 2) return void toast.error("Informe o título do serviço.");
    const val = Number(amount.replace(",", "."));
    if (!Number.isFinite(val) || val <= 0) return void toast.error("Informe um valor válido.");

    setBusy(true);
    try {
      await register({
        data: {
          title: title.trim(),
          amount: val,
          scheduled_for: date ? new Date(date).toISOString() : null,
        },
      });
      toast.success("Serviço registrado com sucesso!");
      setTitle("");
      setAmount("");
      setDate("");
      onClose();
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível registrar o serviço.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar novo serviço</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Descrição do serviço" hint="Ex.: Troca de chuveiro elétrico ou Pintura de sala">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Ex.: Instalação elétrica"
              maxLength={120}
            />
          </Field>
          <Field label="Valor total (R$)" hint="A taxa de 8% da plataforma será deduzida no repasse">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder="250,00"
            />
          </Field>
          <Field label="Data e horário agendado (opcional)">
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <button
            type="button"
            disabled={busy}
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Salvando..." : "Salvar serviço"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
