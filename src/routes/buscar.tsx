import { createFileRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { SearchForm } from "@/components/site/SearchForm";
import { findCategory } from "@/lib/categories";

type Search = { q?: string | undefined; local?: string | undefined; categoria?: string | undefined };
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.slice(0, 100) : undefined);

export const Route = createFileRoute("/buscar")({
  validateSearch: (s: Record<string, unknown>): Search => ({ q: str(s["q"]), local: str(s["local"]), categoria: str(s["categoria"]) }),
  head: () => ({
    meta: [
      { title: "Buscar profissionais — A Seu Serviço" },
      { name: "description", content: "Encontre profissionais na sua cidade ou região." },
      { property: "og:title", content: "Buscar profissionais — A Seu Serviço" },
      { property: "og:description", content: "Encontre profissionais na sua cidade ou região." },
    ],
  }),
  component: BuscarPage,
});

function BuscarPage() {
  const { q, local, categoria } = Route.useSearch();
  const cat = findCategory(categoria);
  const label = [cat?.name, q].filter(Boolean).join(" · ") || "Todos os serviços";

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <SearchForm key={`${q}-${local}`} initialQ={q} initialLocal={local} />
      <div className="mt-10">
        <h1 className="text-3xl font-bold">{label}</h1>
        <p className="text-muted-foreground">{local ? `Em ${local}` : "Em todas as regiões"}</p>
      </div>
      {/* Resultados virão do cadastro real de profissionais em etapa futura. */}
      <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-16 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 text-lg font-semibold">Ainda não há profissionais cadastrados aqui</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">Estamos reunindo os primeiros profissionais da sua região. Volte em breve.</p>
      </div>
    </section>
  );
}
