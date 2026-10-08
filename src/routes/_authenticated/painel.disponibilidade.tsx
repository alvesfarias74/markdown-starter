import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { myProQuery } from "@/lib/my-pro-query";
import { saveProfessional } from "@/lib/professionals.functions";
import { BR_STATES, WEEK_DAYS, type ProfessionalPatch, type ProfessionalView } from "@/lib/professional";
import { Chip, Field, inputClass } from "@/components/site/Field";

export const Route = createFileRoute("/_authenticated/painel/disponibilidade")({
  head: () => ({ meta: [{ title: "Disponibilidade — A Seu Serviço" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myProQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar.</p>,
  component: Disponibilidade,
});

function Disponibilidade() {
  const { data } = useSuspenseQuery(myProQuery());
  const save = useServerFn(saveProfessional);
  const qc = useQueryClient();
  const p = data.pro;
  const [avail, setAvail] = useState(p?.is_available ?? true);
  const [days, setDays] = useState<string[]>(p?.schedule.days ?? []);
  const [hours, setHours] = useState(p?.schedule.hours ?? "");
  const [city, setCity] = useState(p?.city ?? "");
  const [state, setState] = useState(p?.state ?? "");
  const [hoods, setHoods] = useState((p?.neighborhoods ?? []).join(", "));
  const [dist, setDist] = useState(p?.max_distance_km?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <section className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="text-3xl font-bold">Disponibilidade</h1>
      <div className="mt-6 space-y-5 rounded-3xl border bg-card p-6">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setAvail(true)} className={`rounded-xl border px-4 py-3 font-semibold ${avail ? "border-primary bg-accent text-accent-foreground" : ""}`}>Disponível</button>
          <button type="button" onClick={() => setAvail(false)} className={`rounded-xl border px-4 py-3 font-semibold ${!avail ? "border-primary bg-accent text-accent-foreground" : ""}`}>Indisponível</button>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Dias da semana</p>
          <div className="flex flex-wrap gap-2">{WEEK_DAYS.map((d) => <Chip key={d.value} active={days.includes(d.value)} onClick={() => setDays((x) => (x.includes(d.value) ? x.filter((y) => y !== d.value) : [...x, d.value]))}>{d.label}</Chip>)}</div>
        </div>
        <Field label="Horários" hint="Ex.: 8h às 18h"><input value={hours} onChange={(e) => setHours(e.target.value)} className={inputClass} maxLength={80} /></Field>
        <hr />
        <p className="font-semibold">Área de atendimento</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="Cidade"><input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} maxLength={80} /></Field>
          <Field label="Estado"><select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}><option value="">UF</option>{BR_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        </div>
        <Field label="Bairros ou regiões" hint="Separe por vírgula."><input value={hoods} onChange={(e) => setHoods(e.target.value)} className={inputClass} maxLength={1000} /></Field>
        <Field label="Distância máxima (km)"><input type="number" min={0} max={500} value={dist} onChange={(e) => setDist(e.target.value)} className={inputClass} /></Field>
        <button type="button" disabled={busy} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60"
          onClick={async () => {
            if (city.trim().length < 2 || !state) return void toast.error("Informe cidade e estado.");
            const d = dist.trim() ? Math.min(500, Math.max(0, Math.round(Number(dist)))) : null;
            setBusy(true);
            try {
              await save({ data: {
                is_available: avail,
                schedule: { days: days as ProfessionalView["schedule"]["days"], hours: hours.trim() },
                city: city.trim(), state: state as ProfessionalPatch["state"],
                neighborhoods: hoods.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30),
                max_distance_km: d !== null && Number.isFinite(d) ? d : null,
              } });
              await qc.invalidateQueries();
              toast.success("Disponibilidade salva.");
            } catch { toast.error("Não foi possível salvar."); }
            finally { setBusy(false); }
          }}>{busy ? "Salvando..." : "Salvar"}</button>
      </div>
    </section>
  );
}
