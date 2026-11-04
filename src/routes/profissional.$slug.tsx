import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublicProfessional } from "@/lib/professionals.functions";
import { ProfessionalProfileView } from "@/components/pro/ProfessionalProfileView";
import { pageHead } from "@/lib/page-head";

const proQuery = (slug: string) =>
  queryOptions({ queryKey: ["professional", slug], queryFn: () => getPublicProfessional({ data: { slug } }) });

export const Route = createFileRoute("/profissional/$slug")({
  loader: async ({ context, params }) => {
    const pro = await context.queryClient.ensureQueryData(proQuery(params.slug));
    if (!pro) throw notFound();
    return pro;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return pageHead("Profissional não encontrado — A Seu Serviço", "Este perfil não existe ou não está publicado.", true);
    const title = `${loaderData.display_name} — ${loaderData.headline ?? "Profissional"}${loaderData.city ? ` em ${loaderData.city}` : ""} | A Seu Serviço`;
    const desc = (loaderData.bio ?? `${loaderData.headline ?? "Profissional"} na A Seu Serviço.`).slice(0, 155);
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }, { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  notFoundComponent: () => (
    <section className="mx-auto max-w-md px-4 pt-20 text-center">
      <h1 className="text-3xl font-bold">Profissional não encontrado</h1>
      <p className="mt-2 text-muted-foreground">Este perfil não existe ou não está publicado.</p>
      <Link to="/buscar" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Buscar profissionais</Link>
    </section>
  ),
  errorComponent: () => <p className="mx-auto max-w-md px-4 pt-20 text-center">Não foi possível carregar este perfil. Tente novamente.</p>,
  component: ProPublicPage,
});

function ProPublicPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(proQuery(slug));
  if (!data) return null;
  return <section className="mx-auto max-w-6xl px-4 pt-8"><ProfessionalProfileView pro={data} /></section>;
}
