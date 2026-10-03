import { BadgeCheck, Briefcase, CalendarDays, MapPin, Star, Wrench } from "lucide-react";
import { toast } from "sonner";
import { experienceLabel, priceUnitLabel, WEEK_DAYS, type ProfessionalView } from "@/lib/professional";

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ProfessionalProfileView({ pro, preview = false }: { pro: ProfessionalView; preview?: boolean }) {
  const days = WEEK_DAYS.filter((d) => pro.schedule.days.includes(d.value)).map((d) => d.label);
  const initials = pro.display_name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border bg-card shadow-soft">
        <div className="h-24 bg-primary sm:h-32" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {pro.avatar ? (
                <img src={pro.avatar} alt={pro.display_name} className="h-24 w-24 rounded-2xl border-4 border-card object-cover sm:h-28 sm:w-28" />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-card bg-accent font-display text-3xl font-bold text-accent-foreground sm:h-28 sm:w-28">{initials}</div>
              )}
              <div className="pb-1">
                <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
                  {pro.display_name}
                  {pro.is_verified && <BadgeCheck className="h-6 w-6 text-primary" aria-label="Profissional verificado" />}
                </h1>
                <p className="font-medium text-primary">{pro.headline ?? pro.specialties[0]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast(preview ? "Clientes usarão este botão para pedir orçamento." : "Os pedidos de orçamento estarão disponíveis em breve.")}
              className="rounded-2xl bg-highlight px-6 py-3 font-semibold text-highlight-foreground hover:brightness-105"
            >
              Solicitar orçamento
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 font-medium ${pro.is_available ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
              {pro.is_available ? "● Disponível para novos serviços" : "Indisponível no momento"}
            </span>
            {(pro.city || pro.state) && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1"><MapPin className="h-4 w-4" />{[pro.city, pro.state].filter(Boolean).join(" - ")}</span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Star className="h-4 w-4 text-highlight" />
              {pro.rating_count ? `${pro.rating_avg?.toFixed(1)} (${pro.rating_count} avaliações)` : "Sem avaliações ainda"}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1"><Wrench className="h-4 w-4" />{pro.services_count} serviços realizados</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {pro.bio && (
            <section className="rounded-3xl border bg-card p-6">
              <h2 className="text-xl font-bold">Sobre o trabalho</h2>
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{pro.bio}</p>
            </section>
          )}
          {pro.specialties.length > 0 && (
            <section className="rounded-3xl border bg-card p-6">
              <h2 className="text-xl font-bold">Especialidades</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {pro.specialties.map((s) => <span key={s} className="rounded-full bg-secondary px-3 py-1 text-sm">{s}</span>)}
              </div>
            </section>
          )}
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="text-xl font-bold">Portfólio</h2>
            {pro.portfolio.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nenhum trabalho publicado ainda.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {pro.portfolio.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-2xl border">
                    {item.before_photo && item.after_photo ? (
                      <div className="grid grid-cols-2">
                        {[["Antes", item.before_photo], ["Depois", item.after_photo]].map(([l, src]) => (
                          <figure key={l} className="relative"><img src={src} alt={`${item.title} — ${l}`} loading="lazy" className="aspect-square w-full object-cover" /><figcaption className="absolute bottom-2 left-2 rounded-full bg-ink px-2 py-0.5 text-xs text-ink-foreground">{l}</figcaption></figure>
                        ))}
                      </div>
                    ) : (
                      (item.photos[0] || item.after_photo || item.before_photo) && <img src={item.photos[0] ?? item.after_photo ?? item.before_photo ?? ""} alt={item.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    )}
                    {item.photos.length > 1 && (
                      <div className="flex gap-1 overflow-x-auto p-1">{item.photos.slice(1).map((p) => <img key={p} src={p} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" />)}</div>
                    )}
                    <div className="p-4">
                      <p className="font-semibold">{item.title}</p>
                      {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="text-xl font-bold">Avaliações</h2>
            <p className="mt-3 text-sm text-muted-foreground">{pro.rating_count ? `${pro.rating_count} avaliações` : "Este profissional ainda não recebeu avaliações."}</p>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">Preço inicial</p>
            <p className="mt-1 font-display text-2xl font-bold">
              {pro.price_from != null && pro.price_unit !== "combinar" ? money(pro.price_from) : "A combinar"}
            </p>
            {pro.price_unit && pro.price_unit !== "combinar" && <p className="text-sm text-muted-foreground">{priceUnitLabel(pro.price_unit)}</p>}
          </div>
          {(experienceLabel(pro.experience_range) || pro.experience_text) && (
            <div className="rounded-3xl border bg-card p-6">
              <p className="flex items-center gap-2 font-semibold"><Briefcase className="h-4 w-4 text-primary" />Experiência</p>
              {experienceLabel(pro.experience_range) && <p className="mt-2">{experienceLabel(pro.experience_range)}</p>}
              {pro.experience_text && <p className="mt-1 text-sm text-muted-foreground">{pro.experience_text}</p>}
            </div>
          )}
          <div className="rounded-3xl border bg-card p-6">
            <p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-primary" />Onde atende</p>
            <p className="mt-2">{[pro.city, pro.state].filter(Boolean).join(" - ") || "Não informado"}</p>
            {pro.neighborhoods.length > 0 && <p className="mt-1 text-sm text-muted-foreground">{pro.neighborhoods.join(", ")}</p>}
            {pro.max_distance_km != null && <p className="mt-1 text-sm text-muted-foreground">Desloca-se até {pro.max_distance_km} km</p>}
          </div>
          {(days.length > 0 || pro.schedule.hours) && (
            <div className="rounded-3xl border bg-card p-6">
              <p className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-primary" />Atendimento</p>
              {days.length > 0 && <p className="mt-2">{days.join(", ")}</p>}
              {pro.schedule.hours && <p className="mt-1 text-sm text-muted-foreground">{pro.schedule.hours}</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
