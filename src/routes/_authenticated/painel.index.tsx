import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, ExternalLink } from "lucide-react";
import { myProQuery } from "@/lib/my-pro-query";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/painel/")({
  head: () => ({ meta: [{ title: "Meu painel — A Seu Serviço" }, { name: "description", content: "Gerencie seu perfil profissional." }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myProQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar seu painel.</p>,
  component: Painel,
});

function Painel() {
  const { data } = useSuspenseQuery(myProQuery());
  const { items, percent } = data.completeness;
  const published = data.pro?.status === "published";

  return (
    <section className="mx-auto max-w-3xl px-4 pt-10">
      <p className="text-sm text-muted-foreground">Olá, {data.account.full_name || "profissional"}</p>
      <h1 className="mt-1 text-4xl font-bold">{percent === 100 ? "Seu perfil está completo!" : "Seu perfil está quase pronto!"}</h1>

      <div className="mt-6 rounded-3xl border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between font-semibold"><span>Perfil {percent}% completo</span><span className="text-sm text-muted-foreground">{published ? "Publicado" : "Rascunho"}</span></div>
        <Progress value={percent} className="mt-3 h-3" />
        <ul className="mt-6 space-y-2">
          {items.map((i) => (
            <li key={i.key}>
              <Link to="/painel/perfil" search={{ passo: i.step }} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted">
                <span className={`grid h-6 w-6 place-items-center rounded-md border ${i.done ? "border-primary bg-primary text-primary-foreground" : ""}`}>{i.done && <Check className="h-4 w-4" />}</span>
                <span className={i.done ? "" : "font-medium"}>{i.label}</span>
                {!i.done && <span className="ml-auto text-sm text-primary">Completar</span>}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-xl bg-accent p-4 text-sm text-accent-foreground">Perfis completos têm mais informações para ajudar clientes a escolherem um profissional.</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/painel/perfil" search={{ passo: published ? 2 : 1 }} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">{published ? "Editar perfil" : "Continuar cadastro"}</Link>
        {published && data.pro && (
          <Link to="/profissional/$slug" params={{ slug: data.pro.slug }} className="flex items-center gap-2 rounded-xl border bg-card px-5 py-3 font-semibold">
            Ver minha página pública <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
