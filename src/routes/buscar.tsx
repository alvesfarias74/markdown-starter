import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, SearchX } from "lucide-react";
import { SearchForm } from "@/components/site/SearchForm";
import { findCategory } from "@/lib/categories";
import { searchProfessionals } from "@/lib/professionals.functions";

type Search = { q?: string | undefined; local?: string | undefined; categoria?: string | undefined };
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.slice(0, 100) : undefined);

const searchQuery = (s: Search) =>
  queryOptions({
    queryKey: ["search", s.q ?? "", s.local ?? "", s.categoria ?? ""],
    queryFn: () => searchProfessionals({ data: { q: s.q, local: s.local, categoria: s.categoria } }),
  });

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: str(s["q"]), local: str(s["local"]), categoria: str(s["categoria"]) }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(searchQuery(deps)),
  head: () => ({
    meta: [
      { title: "Buscar profissionais — A Seu Serviço" },
      { name: "description", content: "Encontre profissionais na sua cidade ou região." },
      { property: "og:title", content: "Buscar profissionais — A Seu Serviço" },
      { property: "og:description", content: "Encontre profissionais na sua cidade ou região." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => <p className="px-4 pt-20 text-center">Busca indisponível no momento.</p>,
  component: BuscarPage,
});

function BuscarPage() {
  const search = Route.useSearch();
  const { q, local, categoria } = search;
  const { data } = useSuspenseQuery(searchQuery(search));
  const cat = findCategory(categoria);
  const label = [cat?.name, q].filter(Boolean).join(" · ") || "Todos os serviços";

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <SearchForm key={`${q}-${local}`} initialQ={q} initialLocal={local} />
      <div className="mt-10">
        <h1 className="text-3xl font-bold">{label}</h1>
        <p className="text-muted-foreground">{local ? `Em ${local}` : "Em todas as regiões"} · {data.results.length} profissionais</p>
      </div>
      {data.results.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-16 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold">Nenhum profissional encontrado</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Estamos reunindo os primeiros profissionais da sua região. Tente outra busca ou volte em breve.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((p) => (
            <Link key={p.slug} to="/profissional/$slug" params={{ slug: p.slug }} className="flex gap-4 rounded-2xl border bg-card p-4 transition hover:border-primary hover:shadow-soft">
              {p.avatar ? <img src={p.avatar} alt="" loading="lazy" className="h-16 w-16 rounded-xl object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-xl bg-accent font-display text-xl font-bold text-accent-foreground">{p.display_name[0]}</div>}
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-semibold">{p.display_name}{p.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}</p>
                <p className="text-sm text-primary">{p.headline}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{[p.city, p.state].filter(Boolean).join(" - ")}</p>
                <p className={`mt-1 text-xs font-medium ${p.is_available ? "text-primary" : "text-muted-foreground"}`}>{p.is_available ? "Disponível" : "Indisponível"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
