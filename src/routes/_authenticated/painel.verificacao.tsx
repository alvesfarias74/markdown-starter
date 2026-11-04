import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, FileUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { dashboardQuery } from "@/lib/dashboard-query";
import { myProQuery } from "@/lib/my-pro-query";
import { submitVerification } from "@/lib/dashboard.functions";
import { VERIFICATION_STATUS } from "@/lib/commission";
import { Field, inputClass } from "@/components/site/Field";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/painel/verificacao")({
  head: () => pageHead("Verificação — A Seu Serviço", "Envie documentos privados e acompanhe a verificação profissional.", true),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(dashboardQuery()), context.queryClient.ensureQueryData(myProQuery())]),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar.</p>,
  component: Verificacao,
});

async function uploadDoc(userId: string, file: File) {
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") throw new Error("Envie uma foto ou PDF.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Arquivo de no máximo 8 MB.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("verification-docs").upload(path, file, { contentType: file.type });
  if (error) throw new Error("Não foi possível enviar o arquivo.");
  return path;
}

function Verificacao() {
  const { data } = useSuspenseQuery(dashboardQuery());
  const { data: me } = useSuspenseQuery(myProQuery());
  const submit = useServerFn(submitVerification);
  const qc = useQueryClient();
  const status = (data.verification?.status ?? "not_sent") as keyof typeof VERIFICATION_STATUS;
  const [doc, setDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const canSend = status === "not_sent" || status === "needs_fix";

  const pick = (set: (p: string) => void) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { set(await uploadDoc(me.userId, f)); toast.success("Arquivo enviado."); } catch (err) { toast.error((err as Error).message); }
  };

  return (
    <section className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="text-3xl font-bold">Verificação do profissional</h1>
      <p className="mt-2 text-muted-foreground">A verificação confirma sua identidade e pode aumentar a confiança dos clientes no seu perfil. Ela não garante mais contratações.</p>
      <div className="mt-6 flex items-center gap-3 rounded-2xl border bg-card p-5">
        <BadgeCheck className={`h-8 w-8 ${status === "verified" ? "text-primary" : "text-muted-foreground"}`} />
        <div><p className="text-sm text-muted-foreground">Status</p><p className="font-display text-xl font-bold">{VERIFICATION_STATUS[status]}</p></div>
      </div>
      {status === "needs_fix" && data.verification?.reviewer_notes && <p className="mt-3 rounded-xl bg-highlight/20 p-4 text-sm">O que corrigir: {data.verification.reviewer_notes}</p>}
      {status === "pending" && <p className="mt-3 rounded-xl bg-accent p-4 text-sm text-accent-foreground">Recebemos seus documentos. Você será avisado quando a análise terminar.</p>}

      {canSend && (
        <div className="mt-6 space-y-4 rounded-3xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Seus documentos são privados e usados apenas para verificação. Nunca aparecem no perfil.</p>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4">
            <FileUp className="h-5 w-5 text-primary" />
            <span className="flex-1">{doc ? "✓ Documento com foto enviado" : "Documento com foto (RG ou CNH)"}</span>
            <input type="file" accept="image/*,application/pdf" hidden onChange={pick(setDoc)} />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4">
            <FileUp className="h-5 w-5 text-primary" />
            <span className="flex-1">{selfie ? "✓ Selfie enviada" : "Selfie segurando o documento (opcional)"}</span>
            <input type="file" accept="image/*" hidden onChange={pick(setSelfie)} />
          </label>
          <Field label="Observações (opcional)"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} className={inputClass} /></Field>
          <button type="button" disabled={!doc || busy} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
            onClick={async () => {
              if (!doc) return;
              setBusy(true);
              try { await submit({ data: { document_path: doc, selfie_path: selfie, notes: notes.trim() || null } }); toast.success("Enviado para análise."); await qc.invalidateQueries({ queryKey: ["dashboard"] }); }
              catch (e) { toast.error((e as Error).message || "Não foi possível enviar."); }
              finally { setBusy(false); }
            }}>{busy ? "Enviando..." : "Enviar para verificação"}</button>
        </div>
      )}
    </section>
  );
}
