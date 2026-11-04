import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { myProQuery } from "@/lib/my-pro-query";
import { categoryOfService } from "@/lib/services";
import { PortfolioManager } from "@/components/pro/PortfolioManager";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/painel/portfolio")({
  head: () => pageHead("Meu portfólio — A Seu Serviço", "Organize as fotos e informações dos seus trabalhos profissionais.", true),
  loader: ({ context }) => context.queryClient.ensureQueryData(myProQuery()),
  errorComponent: () => <p className="px-4 pt-20 text-center">Não foi possível carregar seu portfólio.</p>,
  component: Portfolio,
});

function Portfolio() {
  const { data } = useSuspenseQuery(myProQuery());
  const qc = useQueryClient();
  return (
    <section className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="text-3xl font-bold">Portfólio</h1>
      <p className="mt-1 text-muted-foreground">Mostre trabalhos que você já fez. Fotos de antes e depois ajudam muito.</p>
      <div className="mt-6 rounded-3xl border bg-card p-6">
        <PortfolioManager
          userId={data.userId}
          view={data.pro?.portfolio ?? []}
          raw={data.portfolioRaw}
          defaultCategory={data.pro?.specialties[0] ? categoryOfService(data.pro.specialties[0]) : null}
          onChange={() => qc.invalidateQueries({ queryKey: ["my-professional"] })}
        />
      </div>
    </section>
  );
}
