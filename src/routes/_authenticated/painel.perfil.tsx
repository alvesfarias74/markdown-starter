import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Camera, Search, X } from "lucide-react";
import { myProQuery } from "@/lib/my-pro-query";
import {
  publishProfessional, saveAccount, saveProfessional,
} from "@/lib/professionals.functions";
import {
  BR_STATES, EXPERIENCE_OPTIONS, PRICE_UNITS, WEEK_DAYS, type ProfessionalPatch, type ProfessionalView,
} from "@/lib/professional";
import { SERVICES, normalize, categoryOfService } from "@/lib/services";
import { uploadImage } from "@/lib/upload";
import { Chip, Field, inputClass } from "@/components/site/Field";
import { ProfessionalProfileView } from "@/components/pro/ProfessionalProfileView";
import { PickButton, PortfolioManager } from "@/components/pro/PortfolioManager";
import { Progress } from "@/components/ui/progress";

const TOTAL = 10;
const TITLES = ["Dados básicos", "Profissão", "Experiência", "Apresentação", "Região de atendimento", "Disponibilidade", "Preço", "Portfólio", "Foto de perfil", "Revisão"];

export const Route = createFileRoute("/_authenticated/painel/perfil")({
  validateSearch: (s: Record<string, unknown>) => {
    const n = Number(s["passo"]);
    return { passo: Number.isInteger(n) && n >= 1 && n <= TOTAL ? n : 1 };
  },
  head: () => ({ meta: [{ title: "Meu perfil profissional — A Seu Serviço" }, { name: "description", content: "Monte sua vitrine profissional." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myProQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar seu cadastro.</p>,
  component: Wizard,
});

type Data = Awaited<ReturnType<ReturnType<typeof myProQuery>["queryFn"] & {}>>;

function Wizard() {
  const { passo } = Route.useSearch();
  const { data } = useSuspenseQuery(myProQuery());
  const navigate = useNavigate();
  const qc = useQueryClient();
  const save = useServerFn(saveProfessional);

  const go = (n: number) => navigate({ to: "/painel/perfil", search: { passo: n } });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-professional"] });
  const savePatch = async (patch: ProfessionalPatch, next = true) => {
    try {
      await save({ data: patch });
      await refresh();
      if (next) go(Math.min(passo + 1, TOTAL));
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    }
  };

  const props = { data, savePatch, go, refresh, passo };
  const steps: Record<number, ReactNode> = {
    1: <StepAccount {...props} />,
    2: <StepServices {...props} />,
    3: <StepExperience {...props} />,
    4: <StepBio {...props} />,
    5: <StepRegion {...props} />,
    6: <StepAvailability {...props} />,
    7: <StepPrice {...props} />,
    8: <StepPortfolio {...props} />,
    9: <StepAvatar {...props} />,
    10: <StepReview {...props} />,
  };

  return (
    <section className={`mx-auto px-4 pt-8 ${passo === TOTAL ? "max-w-6xl" : "max-w-2xl"}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-primary">Passo {passo} de {TOTAL} · {TITLES[passo - 1]}</span>
          <Link to="/painel" className="text-muted-foreground hover:text-foreground">Salvar e sair</Link>
        </div>
        <Progress value={(passo / TOTAL) * 100} className="mt-2 h-2" />
      </div>
      {steps[passo]}
    </section>
  );
}

type StepProps = {
  data: Data;
  savePatch: (p: ProfessionalPatch, next?: boolean) => Promise<void>;
  go: (n: number) => void;
  refresh: () => Promise<void>;
  passo: number;
};

function StepShell({ title, subtitle, children, onNext, nextLabel = "Continuar", busy, onSkip, passo, go }: {
  title: string; subtitle?: string; children: ReactNode; onNext: () => void; nextLabel?: string; busy?: boolean; onSkip?: () => void; passo: number; go: (n: number) => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 space-y-5 rounded-3xl border bg-card p-6 shadow-soft">{children}</div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {passo > 1 && <button type="button" onClick={() => go(passo - 1)} className="rounded-xl border bg-card px-5 py-3 font-semibold">Voltar</button>}
        <button type="button" disabled={busy} onClick={onNext} className="flex-1 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60 sm:flex-none">{busy ? "Salvando..." : nextLabel}</button>
        {onSkip && <button type="button" onClick={onSkip} className="px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">Pular por enquanto</button>}
      </div>
    </div>
  );
}

function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = (fn: () => Promise<void>) => async () => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  return { busy, run };
}

/* 1 — Dados básicos */
function StepAccount({ data, go, refresh, passo }: StepProps) {
  const saveAcc = useServerFn(saveAccount);
  const [name, setName] = useState(data.account.full_name ?? "");
  const [phone, setPhone] = useState(data.account.phone ?? "");
  const [accept, setAccept] = useState(!!data.account.terms_accepted_at);
  const { busy, run } = useBusy();
  return (
    <StepShell title="Seus dados" subtitle="Seu telefone não aparece publicamente." passo={passo} go={go} busy={busy}
      onNext={run(async () => {
        if (name.trim().length < 2) return void toast.error("Informe seu nome.");
        if (!/^[\d\s()+-]{10,20}$/.test(phone.trim())) return void toast.error("Informe um telefone válido com DDD.");
        if (!accept) return void toast.error("É preciso aceitar os termos.");
        try { await saveAcc({ data: { full_name: name, phone, accept_terms: true } }); await refresh(); go(2); }
        catch { toast.error("Não foi possível salvar."); }
      })}>
      <Field label="Nome que aparecerá no perfil"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={80} /></Field>
      <Field label="Telefone (WhatsApp)"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(85) 99999-9999" className={inputClass} maxLength={20} /></Field>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>Li e aceito os <Link to="/termos" target="_blank" className="font-semibold text-primary underline">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="font-semibold text-primary underline">Política de Privacidade</Link>.</span>
      </label>
    </StepShell>
  );
}

/* 2 — Profissão */
function StepServices({ data, savePatch, go, passo }: StepProps) {
  const [selected, setSelected] = useState<string[]>(data.pro?.specialties ?? []);
  const [q, setQ] = useState("");
  const { busy, run } = useBusy();
  const matches = useMemo(() => {
    const n = normalize(q.trim());
    return (n ? SERVICES.filter((s) => normalize(s.name).includes(n)) : SERVICES).slice(0, n ? 30 : 24);
  }, [q]);
  const toggle = (name: string) => setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : s.length >= 15 ? s : [...s, name]));
  const custom = q.trim();
  const canAddCustom = custom.length >= 3 && !SERVICES.some((s) => normalize(s.name) === normalize(custom)) && !selected.includes(custom);

  return (
    <StepShell title="Qual serviço você oferece?" subtitle="Escolha um ou vários. O primeiro será sua profissão principal." passo={passo} go={go} busy={busy}
      onNext={run(async () => { if (!selected.length) return void toast.error("Escolha pelo menos um serviço."); await savePatch({ specialties: selected, headline: selected[0] ?? null }); })}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s, i) => (
            <button key={s} type="button" onClick={() => toggle(s)} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground">
              {i === 0 && <span className="text-xs opacity-80">Principal ·</span>}{s}<X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
      <label className="flex items-center gap-3 rounded-xl border px-4 py-3 focus-within:border-primary">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar serviço (ex.: eletricista)" className="w-full bg-transparent outline-none" maxLength={60} />
      </label>
      <div className="flex flex-wrap gap-2">
        {matches.map((s) => <Chip key={s.name} active={selected.includes(s.name)} onClick={() => toggle(s.name)}>{s.name}</Chip>)}
        {canAddCustom && <Chip active={false} onClick={() => { toggle(custom); setQ(""); }}>+ Adicionar “{custom}”</Chip>}
      </div>
    </StepShell>
  );
}

/* 3 — Experiência */
function StepExperience({ data, savePatch, go, passo }: StepProps) {
  const [range, setRange] = useState(data.pro?.experience_range ?? null);
  const [text, setText] = useState(data.pro?.experience_text ?? "");
  const { busy, run } = useBusy();
  return (
    <StepShell title="Há quanto tempo você trabalha nessa área?" passo={passo} go={go} busy={busy}
      onNext={run(() => savePatch({ experience_range: range as ProfessionalPatch["experience_range"], experience_text: text.trim() || null }))}>
      <div className="grid gap-2 sm:grid-cols-2">
        {EXPERIENCE_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setRange(o.value)} className={`rounded-xl border px-4 py-3 text-left font-medium ${range === o.value ? "border-primary bg-accent text-accent-foreground" : "hover:border-primary"}`}>{o.label}</button>
        ))}
      </div>
      <Field label="Quer contar mais? (opcional)" hint="Ex.: Trabalhei 5 anos em construtora antes de atender por conta própria.">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={300} className={inputClass} />
      </Field>
    </StepShell>
  );
}

/* 4 — Apresentação */
function StepBio({ data, savePatch, go, passo }: StepProps) {
  const [bio, setBio] = useState(data.pro?.bio ?? "");
  const { busy, run } = useBusy();
  return (
    <StepShell title="Conte um pouco sobre seu trabalho." subtitle="Fale sobre sua experiência, especialidades, tipo de serviço que realiza e o que diferencia seu trabalho." passo={passo} go={go} busy={busy}
      onNext={run(async () => { if (bio.trim().length < 20) return void toast.error("Escreva pelo menos algumas palavras (20 caracteres)."); await savePatch({ bio: bio.trim() }); })}>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={8} maxLength={2000} className={inputClass}
        placeholder="Ex.: Sou eletricista há 12 anos. Faço instalação de tomadas, chuveiros e ventiladores, com capricho e limpeza no final do serviço." />
      <p className="text-right text-xs text-muted-foreground">{bio.length}/2000</p>
    </StepShell>
  );
}

/* 5 — Região */
function StepRegion({ data, savePatch, go, passo }: StepProps) {
  const [city, setCity] = useState(data.pro?.city ?? "");
  const [state, setState] = useState(data.pro?.state ?? "");
  const [hoods, setHoods] = useState((data.pro?.neighborhoods ?? []).join(", "));
  const [dist, setDist] = useState(data.pro?.max_distance_km?.toString() ?? "");
  const { busy, run } = useBusy();
  return (
    <StepShell title="Onde você atende?" subtitle="Seu endereço residencial nunca é exibido." passo={passo} go={go} busy={busy}
      onNext={run(async () => {
        if (city.trim().length < 2 || !state) return void toast.error("Informe cidade e estado.");
        const d = dist.trim() ? Math.min(500, Math.max(0, Math.round(Number(dist)))) : null;
        await savePatch({
          city: city.trim(), state: state as ProfessionalPatch["state"],
          neighborhoods: hoods.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 30),
          max_distance_km: d !== null && Number.isFinite(d) ? d : null,
        });
      })}>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Field label="Cidade"><input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} maxLength={80} /></Field>
        <Field label="Estado">
          <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
            <option value="">UF</option>{BR_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Bairros ou regiões que atende" hint="Separe por vírgula. Ex.: Centro, Aldeota, Messejana">
        <input value={hoods} onChange={(e) => setHoods(e.target.value)} className={inputClass} maxLength={1000} />
      </Field>
      <Field label="Distância máxima que aceita se deslocar (km)"><input type="number" min={0} max={500} value={dist} onChange={(e) => setDist(e.target.value)} className={inputClass} /></Field>
    </StepShell>
  );
}

/* 6 — Disponibilidade */
function StepAvailability({ data, savePatch, go, passo }: StepProps) {
  const [avail, setAvail] = useState(data.pro?.is_available ?? true);
  const [days, setDays] = useState<string[]>(data.pro?.schedule.days ?? []);
  const [hours, setHours] = useState(data.pro?.schedule.hours ?? "");
  const { busy, run } = useBusy();
  return (
    <StepShell title="Você está disponível para novos serviços?" passo={passo} go={go} busy={busy}
      onNext={run(() => savePatch({ is_available: avail, schedule: { days: days as ProfessionalView["schedule"]["days"], hours: hours.trim() } }))}>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setAvail(true)} className={`rounded-xl border px-4 py-3 font-semibold ${avail ? "border-primary bg-accent text-accent-foreground" : ""}`}>Disponível</button>
        <button type="button" onClick={() => setAvail(false)} className={`rounded-xl border px-4 py-3 font-semibold ${!avail ? "border-primary bg-accent text-accent-foreground" : ""}`}>Indisponível</button>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Dias de atendimento</p>
        <div className="flex flex-wrap gap-2">{WEEK_DAYS.map((d) => <Chip key={d.value} active={days.includes(d.value)} onClick={() => setDays((x) => x.includes(d.value) ? x.filter((y) => y !== d.value) : [...x, d.value])}>{d.label}</Chip>)}</div>
      </div>
      <Field label="Horários" hint="Ex.: 8h às 18h"><input value={hours} onChange={(e) => setHours(e.target.value)} className={inputClass} maxLength={80} /></Field>
    </StepShell>
  );
}

/* 7 — Preço */
function StepPrice({ data, savePatch, go, passo }: StepProps) {
  const [unit, setUnit] = useState<string>(data.pro?.price_unit ?? "");
  const [price, setPrice] = useState(data.pro?.price_from?.toString() ?? "");
  const { busy, run } = useBusy();
  return (
    <StepShell title="Quanto você costuma cobrar?" subtitle="Opcional. Se o preço depende de cada serviço, escolha “A combinar”." passo={passo} go={go} busy={busy} onSkip={() => go(8)}
      onNext={run(async () => {
        const n = price.trim() ? Number(price.replace(",", ".")) : null;
        if (n !== null && (!Number.isFinite(n) || n < 0)) return void toast.error("Preço inválido.");
        await savePatch({ price_unit: (unit || null) as ProfessionalPatch["price_unit"], price_from: unit === "combinar" ? null : n });
      })}>
      <div className="flex flex-wrap gap-2">{PRICE_UNITS.map((u) => <Chip key={u.value} active={unit === u.value} onClick={() => setUnit(u.value)}>{u.label}</Chip>)}</div>
      {unit && unit !== "combinar" && (
        <Field label="Preço inicial (R$)" hint="O valor a partir do qual você cobra."><input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="80,00" className={inputClass} /></Field>
      )}
    </StepShell>
  );
}

/* 8 — Portfólio */
function StepPortfolio({ data, go, refresh, passo }: StepProps) {
  const items = data.pro?.portfolio ?? [];
  return (
    <StepShell title="Quer mostrar seu trabalho?" subtitle="Fotos de serviços que você já fez ajudam o cliente a conhecer seu trabalho." passo={passo} go={go} onNext={() => go(9)} nextLabel={items.length ? "Continuar" : "Continuar sem portfólio"}>
      <PortfolioManager userId={data.userId} view={items} raw={data.portfolioRaw} defaultCategory={data.pro?.specialties[0] ? categoryOfService(data.pro.specialties[0]) : null} onChange={refresh} />
    </StepShell>
  );
}

/* 9 — Foto de perfil */
function StepAvatar({ data, savePatch, go, passo }: StepProps) {
  const [preview, setPreview] = useState<string | null>(data.pro?.avatar ?? null);
  const [path, setPath] = useState<string | null>(data.pro?.raw_avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const { busy, run } = useBusy();
  return (
    <StepShell title="Adicione uma foto sua" subtitle="Uma foto de rosto, com boa luz, transmite confiança." passo={passo} go={go} busy={busy || uploading} onSkip={() => go(10)}
      onNext={run(() => savePatch({ avatar_url: path }))}>
      <div className="flex flex-col items-center gap-4">
        <PickButton onPick={async (f) => {
          if (!f) return;
          setUploading(true);
          try { const p = await uploadImage(data.userId, f, "avatar"); setPath(p); setPreview(URL.createObjectURL(f)); }
          catch (e) { toast.error((e as Error).message); }
          finally { setUploading(false); }
        }}>
          <span className="grid h-40 w-40 place-items-center overflow-hidden rounded-3xl border border-dashed bg-muted text-muted-foreground">
            {preview ? <img src={preview} alt="Sua foto" className="h-full w-full object-cover" /> : <Camera className="h-10 w-10" />}
          </span>
        </PickButton>
        <p className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Toque para escolher uma foto"}</p>
      </div>
    </StepShell>
  );
}

/* 10 — Revisão */
function StepReview({ data, go, passo, refresh }: StepProps) {
  const publish = useServerFn(publishProfessional);
  const navigate = useNavigate();
  const { busy, run } = useBusy();
  if (!data.pro) return <p>Complete os passos anteriores primeiro. <button className="text-primary underline" onClick={() => go(2)}>Ir para profissão</button></p>;
  const published = data.pro.status === "published";
  return (
    <div>
      <h1 className="text-3xl font-bold sm:text-4xl">Confira seu perfil profissional.</h1>
      <p className="mt-2 text-muted-foreground">É assim que os clientes verão sua página.</p>
      <div className="mt-6 rounded-[2rem] border-4 border-dashed border-border p-2 sm:p-4"><ProfessionalProfileView pro={data.pro} preview /></div>
      <div className="sticky bottom-4 mt-6 flex flex-wrap gap-3 rounded-2xl border bg-card p-4 shadow-soft">
        <button type="button" onClick={() => go(passo - 1)} className="rounded-xl border px-5 py-3 font-semibold">Voltar</button>
        <button type="button" disabled={busy} className="flex-1 rounded-xl bg-highlight px-5 py-3 font-semibold text-highlight-foreground disabled:opacity-60"
          onClick={run(async () => {
            try {
              const r = await publish();
              if (!r.ok) return void toast.error(`Falta completar: ${r.missing.join(", ")}.`);
              await refresh();
              toast.success(published ? "Perfil atualizado!" : "Seu perfil foi publicado!");
              navigate({ to: "/painel" });
            } catch { toast.error("Não foi possível publicar."); }
          })}>
          {busy ? "Publicando..." : published ? "Salvar e manter publicado" : "Publicar meu perfil"}
        </button>
      </div>
    </div>
  );
}
