import { createFileRoute } from "@tanstack/react-router";
import { CategoryGrid } from "@/components/site/CategoryGrid";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias de serviços — A Seu Serviço" },
      { name: "description", content: "Elétrica, hidráulica, limpeza, construção e muito mais. Escolha a categoria do serviço." },
      { property: "og:title", content: "Categorias de serviços — A Seu Serviço" },
      { property: "og:description", content: "Elétrica, hidráulica, limpeza, construção e muito mais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <section className="mx-auto max-w-6xl px-4 pt-12">
      <h1 className="text-4xl font-bold sm:text-5xl">Categorias</h1>
      <p className="mt-2 mb-8 text-muted-foreground">Escolha o tipo de serviço que você precisa.</p>
      <CategoryGrid />
    </section>
  ),
});
